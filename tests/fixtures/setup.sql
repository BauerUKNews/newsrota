-- ============================================================================
-- NEWS ROTA — SIMPLE SUPABASE BACKEND
-- ============================================================================
-- Run this entire file ONCE in Supabase Dashboard -> SQL Editor.
--
-- Architecture:
--   GitHub Pages index.html -> Supabase Data API RPC functions -> Postgres
--
-- No Edge Functions, CLI, Terminal, Node, Google Apps Script or Google login.
-- Staff access is open. Editor and Operations use the shared passwords you set
-- afterwards with the two rota_admin_set_password(...) commands shown at the end.
--
-- IMPORTANT: the browser uses only your Supabase PUBLISHABLE key. The tables,
-- password hashes and sessions below are not directly readable/writable by anon.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- PRIVATE TABLES
-- --------------------------------------------------------------------------

create table if not exists private.rota_meta (
  id smallint primary key default 1 check (id = 1),
  rev bigint not null default 0,
  epoch bigint not null default 0,
  lease_actor text,
  lease_label text,
  lease_password_version text,
  lease_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into private.rota_meta (id) values (1)
on conflict (id) do nothing;

create table if not exists private.rota_entries (
  key text primary key,
  rev bigint not null default 0,
  deleted boolean not null default false,
  json_text text,
  updated_at timestamptz not null default now(),
  updated_by text not null default ''
);

create index if not exists rota_entries_rev_idx on private.rota_entries (rev);

create table if not exists private.rota_passwords (
  role text primary key check (role in ('lead','ops')),
  password_hash text not null,
  version uuid not null,
  updated_at timestamptz not null default now()
);

create table if not exists private.rota_sessions (
  token uuid primary key,
  role text not null check (role in ('lead','ops')),
  client_id text not null default '',
  password_version uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists rota_sessions_expires_idx on private.rota_sessions (expires_at);

alter table private.rota_meta enable row level security;
alter table private.rota_entries enable row level security;
alter table private.rota_passwords enable row level security;
alter table private.rota_sessions enable row level security;

revoke all on table private.rota_meta from public, anon, authenticated;
revoke all on table private.rota_entries from public, anon, authenticated;
revoke all on table private.rota_passwords from public, anon, authenticated;
revoke all on table private.rota_sessions from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- PRIVATE HELPERS
-- --------------------------------------------------------------------------

create or replace function private.rota_normalise_role(p_role text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case lower(trim(coalesce(p_role,'')))
    when 'lead' then 'lead'
    when 'editor' then 'lead'
    when 'leadership' then 'lead'
    when 'ops' then 'ops'
    when 'operations' then 'ops'
    else ''
  end
$$;

create or replace function private.rota_access_json(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token uuid;
  s record;
  v_label text;
begin
  begin
    v_token := nullif(trim(coalesce(p_token,'')), '')::uuid;
  exception when others then
    v_token := null;
  end;

  if v_token is null then
    return pg_catalog.jsonb_build_object(
      'role','staff','canEdit',false,'actor','', 'label','Staff viewer',
      'passwordVersion','', 'authValid',false,'authReason','none'
    );
  end if;

  select ses.token, ses.role, ses.client_id, ses.password_version, ses.expires_at
    into s
  from private.rota_sessions ses
  join private.rota_passwords pw
    on pw.role = ses.role and pw.version = ses.password_version
  where ses.token = v_token
    and ses.expires_at > pg_catalog.now();

  if not found then
    return pg_catalog.jsonb_build_object(
      'role','staff','canEdit',false,'actor','', 'label','Staff viewer',
      'passwordVersion','', 'authValid',false,'authReason','expired-or-invalid'
    );
  end if;

  v_label := (case when s.role='ops' then 'Operations' else 'Editor' end)
             || ' session ' || upper(substr(replace(s.token::text,'-',''),1,4));

  return pg_catalog.jsonb_build_object(
    'role',s.role,
    'canEdit',(s.role='ops'),
    'actor','token:' || s.token::text,
    'label',v_label,
    'passwordVersion',s.password_version::text,
    'authValid',true,
    'authReason',''
  );
end
$$;

create or replace function private.rota_lease_json()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m private.rota_meta%rowtype;
begin
  select * into m from private.rota_meta where id=1;
  if coalesce(m.lease_actor,'')='' or m.lease_expires_at is null or m.lease_expires_at <= pg_catalog.now() then
    return null;
  end if;
  return pg_catalog.jsonb_build_object(
    'actor',m.lease_actor,
    'email',coalesce(nullif(m.lease_label,''),'Operations'),
    'expires',floor(extract(epoch from m.lease_expires_at)*1000)::bigint
  );
end
$$;

create or replace function private.rota_status_json(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m private.rota_meta%rowtype;
  a jsonb;
begin
  select * into m from private.rota_meta where id=1;
  a := private.rota_access_json(p_token);
  return pg_catalog.jsonb_build_object(
    'ok',true,
    'email','',
    'role',a->>'role',
    'canEdit',coalesce((a->>'canEdit')::boolean,false),
    'authValid',coalesce((a->>'authValid')::boolean,false),
    'authReason',coalesce(a->>'authReason',''),
    'rev',m.rev,
    'epoch',m.epoch,
    'lease',private.rota_lease_json()
  );
end
$$;

create or replace function private.rota_hidden_week_ids()
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  t text;
  obj jsonb;
  out_ids text[] := array[]::text[];
  r record;
begin
  select json_text into t
  from private.rota_entries
  where key='settings:public' and deleted=false;

  if t is null or t='' then return out_ids; end if;
  begin obj := t::jsonb; exception when others then return out_ids; end;

  for r in select key, value from pg_catalog.jsonb_each(obj) loop
    if r.value = 'false'::jsonb then out_ids := pg_catalog.array_append(out_ids,r.key); end if;
  end loop;
  return out_ids;
end
$$;

create or replace function private.rota_sanitise_marker_json(p_text text, p_hidden text[])
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  obj jsonb;
  k text;
  wid text;
begin
  begin obj := coalesce(nullif(p_text,''),'{}')::jsonb;
  exception when others then return '{}'; end;

  for k in select pg_catalog.jsonb_object_keys(obj) loop
    wid := pg_catalog.regexp_replace(k, '\|[^|]*\|[^|]*\|[^|]*$', '');
    if wid = any(coalesce(p_hidden,array[]::text[])) then obj := obj - k; end if;
  end loop;
  return obj::text;
end
$$;

-- --------------------------------------------------------------------------
-- PRIVATE EDIT-LOCK / SAVE ENGINE
-- --------------------------------------------------------------------------

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
  lease jsonb;
begin
  select * into m from private.rota_meta where id=1 for update;

  if p_client_epoch is distinct from m.epoch then
    return pg_catalog.jsonb_build_object('ok',false,'error','epoch-mismatch','rev',m.rev,'epoch',m.epoch);
  end if;

  if coalesce(m.lease_actor,'')<>'' and m.lease_expires_at > pg_catalog.now()
     and coalesce(m.lease_password_version,'')<>coalesce(p_password_version,'') then
    update private.rota_meta
      set lease_actor=null, lease_label=null, lease_password_version=null,
          lease_expires_at=null, updated_at=pg_catalog.now()
      where id=1
      returning * into m;
  end if;

  if coalesce(m.lease_actor,'')<>'' and m.lease_expires_at > pg_catalog.now() and m.lease_actor<>p_actor then
    lease := private.rota_lease_json();
    return pg_catalog.jsonb_build_object('ok',false,'error','locked','rev',m.rev,'epoch',m.epoch,'lease',lease);
  end if;

  update private.rota_meta
    set lease_actor=p_actor,
        lease_label=coalesce(nullif(p_label,''),'Operations'),
        lease_password_version=p_password_version,
        lease_expires_at=pg_catalog.now() + pg_catalog.make_interval(secs=>greatest(30,least(p_lease_seconds,900))),
        updated_at=pg_catalog.now()
    where id=1
    returning * into m;

  lease := private.rota_lease_json();
  return pg_catalog.jsonb_build_object('ok',true,'rev',m.rev,'epoch',m.epoch,'lease',lease);
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
  select * into m from private.rota_meta where id=1 for update;
  if p_client_epoch is distinct from m.epoch then
    return pg_catalog.jsonb_build_object('ok',false,'error','epoch-mismatch','rev',m.rev,'epoch',m.epoch);
  end if;

  if coalesce(m.lease_actor,'')=coalesce(p_actor,'') then
    update private.rota_meta
      set lease_actor=null, lease_label=null, lease_password_version=null,
          lease_expires_at=null, updated_at=pg_catalog.now()
      where id=1
      returning * into m;
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
  lease jsonb;
begin
  select * into m from private.rota_meta where id=1 for update;

  if p_client_epoch is distinct from m.epoch then
    return pg_catalog.jsonb_build_object('ok',false,'error','epoch-mismatch','rev',m.rev,'epoch',m.epoch);
  end if;

  if coalesce(m.lease_actor,'')<>'' and m.lease_expires_at > pg_catalog.now()
     and coalesce(m.lease_password_version,'')<>coalesce(p_password_version,'') then
    update private.rota_meta
      set lease_actor=null, lease_label=null, lease_password_version=null,
          lease_expires_at=null, updated_at=pg_catalog.now()
      where id=1;
    m.lease_actor:=null; m.lease_label:=null; m.lease_password_version:=null; m.lease_expires_at:=null;
  end if;

  if coalesce(m.lease_actor,'')<>'' and m.lease_expires_at > pg_catalog.now() and m.lease_actor<>p_actor then
    lease := private.rota_lease_json();
    return pg_catalog.jsonb_build_object('ok',false,'error','locked','rev',m.rev,'epoch',m.epoch,'lease',lease);
  end if;

  update private.rota_meta
    set lease_actor=p_actor,
        lease_label=coalesce(nullif(p_label,''),'Operations'),
        lease_password_version=p_password_version,
        lease_expires_at=pg_catalog.now() + pg_catalog.make_interval(secs=>greatest(30,least(p_lease_seconds,900))),
        updated_at=pg_catalog.now()
    where id=1
    returning * into m;

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

  lease:=private.rota_lease_json();
  return pg_catalog.jsonb_build_object(
    'ok',true,'rev',v_new_rev,'epoch',m.epoch,
    'keyRev',key_rev,'conflicts',conflicts,'lease',lease
  );
end
$$;

-- --------------------------------------------------------------------------
-- PUBLIC DATA API / RPC SURFACE
-- These are the ONLY functions the GitHub page needs to call.
-- --------------------------------------------------------------------------

create or replace function public.rota_health()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare m private.rota_meta%rowtype;
begin
  select * into m from private.rota_meta where id=1;
  return pg_catalog.jsonb_build_object('ok',true,'service','news-rota','rev',m.rev,'epoch',m.epoch);
end
$$;

create or replace function public.rota_get_bootstrap(p_token text default '')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a jsonb := private.rota_access_json(p_token);
  status jsonb := private.rota_status_json(p_token);
  role_name text;
  hidden text[] := array[]::text[];
  out_data jsonb := '{}'::jsonb;
  r record;
  v_json text;
  n bigint;
begin
  role_name:=a->>'role';
  if role_name='staff' then hidden:=private.rota_hidden_week_ids(); end if;

  select count(*) into n from private.rota_entries;

  for r in select key,rev,deleted,json_text from private.rota_entries loop
    if r.key='settings:resetEpoch' then continue; end if;
    if role_name='staff' and r.key like 'week:%' and substring(r.key from 6)=any(hidden) then continue; end if;
    if role_name='staff' and r.key='settings:allowances' then continue; end if;

    v_json:=case when r.deleted then null else r.json_text end;
    if role_name='staff' and not r.deleted
       and r.key in ('settings:cellNotes','settings:cellColors','settings:cellVoid','settings:cellCover') then
      v_json:=private.rota_sanitise_marker_json(v_json,hidden);
    end if;

    out_data:=out_data || pg_catalog.jsonb_build_object(
      r.key,
      pg_catalog.jsonb_build_object('json',v_json,'rev',r.rev,'deleted',r.deleted)
    );
  end loop;

  return status || pg_catalog.jsonb_build_object('data',out_data,'empty',(n=0));
end
$$;

create or replace function public.rota_get_changes(
  p_since_rev bigint,
  p_client_epoch bigint,
  p_token text default ''
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a jsonb := private.rota_access_json(p_token);
  status jsonb := private.rota_status_json(p_token);
  role_name text;
  hidden text[] := array[]::text[];
  m private.rota_meta%rowtype;
  arr jsonb := '[]'::jsonb;
  r record;
  v_json text;
begin
  select * into m from private.rota_meta where id=1;
  if p_client_epoch is distinct from m.epoch then
    return status || pg_catalog.jsonb_build_object('ok',false,'error','epoch-mismatch','changes','[]'::jsonb);
  end if;

  if m.rev<=coalesce(p_since_rev,0) then
    return status || pg_catalog.jsonb_build_object('changes','[]'::jsonb);
  end if;

  role_name:=a->>'role';
  if role_name='staff' then hidden:=private.rota_hidden_week_ids(); end if;

  for r in
    select key,rev,deleted,json_text
    from private.rota_entries
    where rev>coalesce(p_since_rev,0)
    order by rev,key
  loop
    if r.key='settings:resetEpoch' then continue; end if;
    if role_name='staff' and r.key like 'week:%' and substring(r.key from 6)=any(hidden) then continue; end if;
    if role_name='staff' and r.key='settings:allowances' then continue; end if;

    v_json:=case when r.deleted then null else r.json_text end;
    if role_name='staff' and not r.deleted
       and r.key in ('settings:cellNotes','settings:cellColors','settings:cellVoid','settings:cellCover') then
      v_json:=private.rota_sanitise_marker_json(v_json,hidden);
    end if;

    arr:=arr || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('key',r.key,'json',v_json,'rev',r.rev,'deleted',r.deleted)
    );
  end loop;

  return status || pg_catalog.jsonb_build_object('changes',arr);
end
$$;

create or replace function public.rota_verify_access_password(
  p_role text,
  p_password text,
  p_client_id text default ''
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := private.rota_normalise_role(p_role);
  pw private.rota_passwords%rowtype;
  v_token uuid;
  status jsonb;
begin
  if v_role not in ('lead','ops') then return pg_catalog.jsonb_build_object('ok',false,'error','invalid-role'); end if;

  select * into pw from private.rota_passwords where role=v_role;
  if not found then return pg_catalog.jsonb_build_object('ok',false,'error','password-not-set'); end if;

  if extensions.crypt(coalesce(p_password,''),pw.password_hash)<>pw.password_hash then
    perform pg_catalog.pg_sleep(0.35);
    return pg_catalog.jsonb_build_object('ok',false,'error','wrong-password');
  end if;

  delete from private.rota_sessions where expires_at<=pg_catalog.now();
  if coalesce(p_client_id,'')<>'' then
    delete from private.rota_sessions where role=v_role and client_id=left(p_client_id,80);
  end if;

  v_token:=pg_catalog.gen_random_uuid();
  insert into private.rota_sessions(token,role,client_id,password_version,expires_at)
  values(v_token,v_role,left(coalesce(p_client_id,''),80),pw.version,pg_catalog.now()+interval '12 hours');

  status:=private.rota_status_json(v_token::text);
  return status || pg_catalog.jsonb_build_object('ok',true,'token',v_token::text);
end
$$;

create or replace function public.rota_claim_edit(p_client_epoch bigint,p_token text default '')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a jsonb:=private.rota_access_json(p_token);
  base jsonb:=private.rota_status_json(p_token);
  r jsonb;
begin
  if a->>'role'<>'ops' then return base || pg_catalog.jsonb_build_object('ok',false,'error','not-editor'); end if;
  r:=private.rota_claim_edit_internal(
    p_client_epoch,a->>'actor',a->>'label',a->>'passwordVersion',180
  );
  return private.rota_status_json(p_token) || r;
end
$$;

create or replace function public.rota_release_edit(p_client_epoch bigint,p_token text default '')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a jsonb:=private.rota_access_json(p_token);
  r jsonb;
begin
  r:=private.rota_release_edit_internal(p_client_epoch,a->>'actor');
  return private.rota_status_json(p_token) || r;
end
$$;

create or replace function public.rota_save_changes(
  p_changes jsonb,
  p_client_rev bigint,
  p_client_epoch bigint,
  p_token text default ''
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a jsonb:=private.rota_access_json(p_token);
  base jsonb:=private.rota_status_json(p_token);
  r jsonb;
begin
  -- p_client_rev is retained for compatibility with the existing browser client.
  if a->>'role'<>'ops' then return base || pg_catalog.jsonb_build_object('ok',false,'error','not-editor'); end if;
  r:=private.rota_save_changes_internal(
    coalesce(p_changes,'[]'::jsonb),p_client_epoch,a->>'actor',a->>'label',a->>'passwordVersion',180
  );
  return private.rota_status_json(p_token) || r;
end
$$;

-- --------------------------------------------------------------------------
-- ADMIN-ONLY MAINTENANCE (run from SQL Editor, never from the browser)
-- --------------------------------------------------------------------------

create or replace function public.rota_admin_set_password(p_role text,p_password text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text:=private.rota_normalise_role(p_role);
  v_version uuid:=pg_catalog.gen_random_uuid();
begin
  if v_role not in ('lead','ops') then raise exception 'Role must be lead or ops'; end if;
  if pg_catalog.length(coalesce(p_password,''))<12 then raise exception 'Use a password of at least 12 characters'; end if;

  insert into private.rota_passwords(role,password_hash,version,updated_at)
  values(v_role,extensions.crypt(p_password,extensions.gen_salt('bf',12)),v_version,pg_catalog.now())
  on conflict(role) do update
    set password_hash=excluded.password_hash,version=excluded.version,updated_at=excluded.updated_at;

  delete from private.rota_sessions where role=v_role;
  if v_role='ops' then
    update private.rota_meta
      set lease_actor=null,lease_label=null,lease_password_version=null,lease_expires_at=null,updated_at=pg_catalog.now()
      where id=1;
  end if;
  return v_role;
end
$$;

create or replace function public.rota_factory_reset()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare new_epoch bigint;
begin
  delete from private.rota_entries;
  update private.rota_meta
    set rev=0,epoch=epoch+1,lease_actor=null,lease_label=null,
        lease_password_version=null,lease_expires_at=null,updated_at=pg_catalog.now()
    where id=1 returning epoch into new_epoch;
  return new_epoch;
end
$$;

-- --------------------------------------------------------------------------
-- LOCK DOWN EVERYTHING, THEN EXPOSE ONLY THE SEVEN SAFE BROWSER RPCS
-- --------------------------------------------------------------------------

revoke execute on all functions in schema private from public, anon, authenticated;

revoke execute on function public.rota_health() from public;
revoke execute on function public.rota_get_bootstrap(text) from public;
revoke execute on function public.rota_get_changes(bigint,bigint,text) from public;
revoke execute on function public.rota_verify_access_password(text,text,text) from public;
revoke execute on function public.rota_claim_edit(bigint,text) from public;
revoke execute on function public.rota_release_edit(bigint,text) from public;
revoke execute on function public.rota_save_changes(jsonb,bigint,bigint,text) from public;
revoke execute on function public.rota_admin_set_password(text,text) from public,anon,authenticated;
revoke execute on function public.rota_factory_reset() from public,anon,authenticated;

grant execute on function public.rota_health() to anon,authenticated;
grant execute on function public.rota_get_bootstrap(text) to anon,authenticated;
grant execute on function public.rota_get_changes(bigint,bigint,text) to anon,authenticated;
grant execute on function public.rota_verify_access_password(text,text,text) to anon,authenticated;
grant execute on function public.rota_claim_edit(bigint,text) to anon,authenticated;
grant execute on function public.rota_release_edit(bigint,text) to anon,authenticated;
grant execute on function public.rota_save_changes(jsonb,bigint,bigint,text) to anon,authenticated;

-- Ask PostgREST to refresh its function list immediately.
notify pgrst, 'reload schema';

-- ============================================================================
-- AFTER THIS SCRIPT HAS RUN SUCCESSFULLY
-- ============================================================================
-- Run these TWO commands separately in the SQL Editor, replacing the examples:
--
-- select public.rota_admin_set_password('lead', 'YOUR-EDITOR-PASSWORD-HERE');
-- select public.rota_admin_set_password('ops',  'YOUR-OPERATIONS-PASSWORD-HERE');
--
-- Minimum 12 characters. Strong/random passwords are highly recommended.
--
-- To change a password later, run the corresponding command again. Existing
-- sessions for that role are invalidated immediately.
--
-- Optional health test after setup:
-- select public.rota_health();
--
-- Emergency reset (wipes shared rota edits, NOT passwords):
-- select public.rota_factory_reset();
-- ============================================================================
