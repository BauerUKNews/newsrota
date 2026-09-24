-- News Rota v1.2 — enable concurrent Operations editing
-- Safe upgrade from the working v1.1 Supabase database.
-- Does NOT delete rota data, passwords, sessions, or revisions.

update private.rota_meta
set lease_actor=null, lease_label=null, lease_password_version=null, lease_expires_at=null
where id=1;

create or replace function private.rota_lease_json()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  -- v1.2+: global edit leases are intentionally disabled.
  select null::jsonb
$$;

create or replace function private.rota_claim_edit_internal(
  p_client_epoch bigint,
  p_actor text,
  p_label text,
  p_password_version text,
  p_lease_seconds integer default 180
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m private.rota_meta%rowtype;
begin
  select * into m from private.rota_meta where id=1;
  if p_client_epoch is distinct from m.epoch then
    return pg_catalog.jsonb_build_object('ok',false,'error','epoch-mismatch','rev',m.rev,'epoch',m.epoch);
  end if;

  -- Compatibility endpoint for older frontends. There is deliberately no
  -- exclusive lease: multiple authorised Operations sessions may edit.
  update private.rota_meta
    set lease_actor=null, lease_label=null, lease_password_version=null,
        lease_expires_at=null
    where id=1 and (lease_actor is not null or lease_expires_at is not null);

  return pg_catalog.jsonb_build_object('ok',true,'rev',m.rev,'epoch',m.epoch,'lease',null);
end
$$;

create or replace function private.rota_release_edit_internal(
  p_client_epoch bigint,
  p_actor text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m private.rota_meta%rowtype;
begin
  select * into m from private.rota_meta where id=1;
  if p_client_epoch is distinct from m.epoch then
    return pg_catalog.jsonb_build_object('ok',false,'error','epoch-mismatch','rev',m.rev,'epoch',m.epoch);
  end if;
  return pg_catalog.jsonb_build_object('ok',true,'rev',m.rev,'epoch',m.epoch,'lease',null);
end
$$;

create or replace function private.rota_save_changes_internal(
  p_changes jsonb,
  p_client_epoch bigint,
  p_actor text,
  p_label text,
  p_password_version text,
  p_lease_seconds integer default 180
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m private.rota_meta%rowtype;
  ch jsonb;
  accepted jsonb := '[]'::jsonb;
  conflicts jsonb := '[]'::jsonb;
  key_rev jsonb := '{}'::jsonb;
  v_key text;
  v_json text;
  v_base_rev bigint;
  v_existing_rev bigint;
  v_new_rev bigint;
  v_public_changed boolean := false;
  v_old_public_text text;
  v_old_public jsonb := '{}'::jsonb;
  v_new_public jsonb := '{}'::jsonb;
  r record;
begin
  select * into m from private.rota_meta where id=1 for update;

  if p_client_epoch is distinct from m.epoch then
    return pg_catalog.jsonb_build_object('ok',false,'error','epoch-mismatch','rev',m.rev,'epoch',m.epoch);
  end if;

  -- Concurrent editing: no global lease check. Per-key base revisions below
  -- prevent a stale edit from silently overwriting a newer save.

  select json_text into v_old_public_text
  from private.rota_entries
  where key='settings:public' and deleted=false;

  begin v_old_public := coalesce(v_old_public_text::jsonb,'{}'::jsonb);
  exception when others then v_old_public := '{}'::jsonb; end;
  v_new_public := v_old_public;

  for ch in select value from pg_catalog.jsonb_array_elements(coalesce(p_changes,'[]'::jsonb)) loop
    v_key := coalesce(ch->>'key','');
    begin v_base_rev := coalesce((ch->>'baseRev')::bigint,0); exception when others then v_base_rev:=0; end;

    if v_key='' or v_key !~ '^(week:|settings:)' or v_key='settings:resetEpoch' then continue; end if;

    if ch ? 'json' and ch->'json' <> 'null'::jsonb then
      v_json := ch->>'json';
      if pg_catalog.length(v_json)>5000000 then
        conflicts := conflicts || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('key',v_key,'rev',0,'error','too-big'));
        continue;
      end if;
    else
      v_json := null;
    end if;

    select rev into v_existing_rev from private.rota_entries where key=v_key;
    if found and v_existing_rev > v_base_rev then
      conflicts := conflicts || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('key',v_key,'rev',v_existing_rev));
      continue;
    end if;

    accepted := accepted || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('key',v_key,'json',v_json));

    if v_key='settings:public' then
      v_public_changed:=true;
      if v_json is null then v_new_public:='{}'::jsonb;
      else
        begin v_new_public:=v_json::jsonb; exception when others then v_new_public:='{}'::jsonb; end;
      end if;
    end if;
  end loop;

  if pg_catalog.jsonb_array_length(accepted)>0 then
    v_new_rev:=m.rev+1;

    for ch in select value from pg_catalog.jsonb_array_elements(accepted) loop
      v_key:=ch->>'key';
      if ch->'json'='null'::jsonb then v_json:=null; else v_json:=ch->>'json'; end if;

      insert into private.rota_entries(key,rev,deleted,json_text,updated_at,updated_by)
      values(v_key,v_new_rev,v_json is null,v_json,pg_catalog.now(),coalesce(p_label,'Operations'))
      on conflict(key) do update
        set rev=excluded.rev, deleted=excluded.deleted, json_text=excluded.json_text,
            updated_at=excluded.updated_at, updated_by=excluded.updated_by;

      key_rev:=key_rev || pg_catalog.jsonb_build_object(v_key,v_new_rev);
    end loop;

    if v_public_changed then
      for r in
        select e.key
        from pg_catalog.jsonb_each(v_old_public) e
        where e.value='false'::jsonb
          and coalesce(v_new_public->e.key,'true'::jsonb)<>'false'::jsonb
      loop
        update private.rota_entries
          set rev=v_new_rev, updated_at=pg_catalog.now(), updated_by=coalesce(p_label,'Operations')
          where key='week:'||r.key and deleted=false;
      end loop;

      update private.rota_entries
        set rev=v_new_rev, updated_at=pg_catalog.now(), updated_by=coalesce(p_label,'Operations')
        where key in ('settings:cellNotes','settings:cellColors','settings:cellVoid','settings:cellCover')
          and deleted=false;
    end if;

    update private.rota_meta set rev=v_new_rev,updated_at=pg_catalog.now() where id=1 returning * into m;
  else
    v_new_rev:=m.rev;
  end if;

  return pg_catalog.jsonb_build_object(
    'ok',true,'rev',v_new_rev,'epoch',m.epoch,
    'keyRev',key_rev,'conflicts',conflicts,'lease',null
  );
end
$$;

-- Ensure browser roles can still call the public wrappers already installed by v1.1.
grant execute on function public.rota_claim_edit(bigint,text) to anon,authenticated;
grant execute on function public.rota_release_edit(bigint,text) to anon,authenticated;
grant execute on function public.rota_save_changes(jsonb,bigint,bigint,text) to anon,authenticated;

notify pgrst, 'reload schema';

select public.rota_health();
