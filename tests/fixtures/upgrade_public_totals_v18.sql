-- News Rota v18: counts from ALL saved weeks, without unpublished names.
-- Run after the existing concurrent-editing upgrade. Safe to rerun.
-- No rota entries, passwords, sessions or visibility flags are changed.
-- Calendar fallback matches the shipped 2027 rota; explicit saved dates take precedence.
begin;
create or replace function private.rota_summary_calendar()
returns jsonb language sql immutable set search_path='' as $calendar$
select '{"WE 1 2 3 Jan":{"satHeader":"SATURDAY 2 JANUARY","sunHeader":"SUNDAY 3 JANUARY","y":2027,"blocked":"See Christmas rota","friHeader":"FRIDAY 1 JANUARY"},"4-8 January":{"cols":[{"y":2027,"m":0,"d":4},{"y":2027,"m":0,"d":5},{"y":2027,"m":0,"d":6},{"y":2027,"m":0,"d":7},{"y":2027,"m":0,"d":8}]},"WE 9&10 Jan":{"satHeader":"SATURDAY 9 JANUARY","sunHeader":"SUNDAY 10 JANUARY","y":2027},"11-15 January":{"cols":[{"y":2027,"m":0,"d":11},{"y":2027,"m":0,"d":12},{"y":2027,"m":0,"d":13},{"y":2027,"m":0,"d":14},{"y":2027,"m":0,"d":15}]},"WE 16&17 Jan":{"satHeader":"SATURDAY 16 JANUARY","sunHeader":"SUNDAY 17 JANUARY","y":2027},"18-22 January":{"cols":[{"y":2027,"m":0,"d":18},{"y":2027,"m":0,"d":19},{"y":2027,"m":0,"d":20},{"y":2027,"m":0,"d":21},{"y":2027,"m":0,"d":22}]},"WE 23&24 Jan":{"satHeader":"SATURDAY 23 JANUARY","sunHeader":"SUNDAY 24 JANUARY","y":2027},"25-29 January":{"cols":[{"y":2027,"m":0,"d":25},{"y":2027,"m":0,"d":26},{"y":2027,"m":0,"d":27},{"y":2027,"m":0,"d":28},{"y":2027,"m":0,"d":29}]},"WE 30&31 Jan":{"satHeader":"SATURDAY 30 JANUARY","sunHeader":"SUNDAY 31 JANUARY","y":2027},"1-5 February":{"cols":[{"y":2027,"m":1,"d":1},{"y":2027,"m":1,"d":2},{"y":2027,"m":1,"d":3},{"y":2027,"m":1,"d":4},{"y":2027,"m":1,"d":5}]},"WE 6&7 Feb":{"satHeader":"SATURDAY 6 FEBRUARY","sunHeader":"SUNDAY 7 FEBRUARY","y":2027},"8-12 February":{"cols":[{"y":2027,"m":1,"d":8},{"y":2027,"m":1,"d":9},{"y":2027,"m":1,"d":10},{"y":2027,"m":1,"d":11},{"y":2027,"m":1,"d":12}]},"WE 13&14 Feb":{"satHeader":"SATURDAY 13 FEBRUARY","sunHeader":"SUNDAY 14 FEBRUARY","y":2027},"15-19 February":{"cols":[{"y":2027,"m":1,"d":15},{"y":2027,"m":1,"d":16},{"y":2027,"m":1,"d":17},{"y":2027,"m":1,"d":18},{"y":2027,"m":1,"d":19}]},"WE 20&21 Feb":{"satHeader":"SATURDAY 20 FEBRUARY","sunHeader":"SUNDAY 21 FEBRUARY","y":2027},"22-26 February":{"cols":[{"y":2027,"m":1,"d":22},{"y":2027,"m":1,"d":23},{"y":2027,"m":1,"d":24},{"y":2027,"m":1,"d":25},{"y":2027,"m":1,"d":26}]},"WE 27&28 Feb":{"satHeader":"SATURDAY 27 FEBRUARY","sunHeader":"SUNDAY 28 FEBRUARY","y":2027},"1-5 March":{"cols":[{"y":2027,"m":2,"d":1},{"y":2027,"m":2,"d":2},{"y":2027,"m":2,"d":3},{"y":2027,"m":2,"d":4},{"y":2027,"m":2,"d":5}]},"WE 6&7 Mar":{"satHeader":"SATURDAY 6 MARCH","sunHeader":"SUNDAY 7 MARCH","y":2027},"8-12 March":{"cols":[{"y":2027,"m":2,"d":8},{"y":2027,"m":2,"d":9},{"y":2027,"m":2,"d":10},{"y":2027,"m":2,"d":11},{"y":2027,"m":2,"d":12}]},"WE 13&14 Mar":{"satHeader":"SATURDAY 13 MARCH","sunHeader":"SUNDAY 14 MARCH","y":2027},"15-19 March":{"cols":[{"y":2027,"m":2,"d":15},{"y":2027,"m":2,"d":16},{"y":2027,"m":2,"d":17},{"y":2027,"m":2,"d":18},{"y":2027,"m":2,"d":19}]},"WE 20&21 Mar":{"satHeader":"SATURDAY 20 MARCH","sunHeader":"SUNDAY 21 MARCH","y":2027},"22-26 March":{"cols":[{"y":2027,"m":2,"d":22},{"y":2027,"m":2,"d":23},{"y":2027,"m":2,"d":24},{"y":2027,"m":2,"d":25},{"y":2027,"m":2,"d":26}]},"WE 27&28 Mar":{"satHeader":"SATURDAY 27 MARCH","sunHeader":"SUNDAY 28 MARCH","y":2027},"29 March - 2 April":{"cols":[{"y":2027,"m":2,"d":29},{"y":2027,"m":2,"d":30},{"y":2027,"m":2,"d":31},{"y":2027,"m":3,"d":1},{"y":2027,"m":3,"d":2}]},"WE 3&4 Apr":{"satHeader":"SATURDAY 3 APRIL","sunHeader":"SUNDAY 4 APRIL","y":2027},"5-9 April":{"cols":[{"y":2027,"m":3,"d":5},{"y":2027,"m":3,"d":6},{"y":2027,"m":3,"d":7},{"y":2027,"m":3,"d":8},{"y":2027,"m":3,"d":9}]},"WE 10&11 Apr":{"satHeader":"SATURDAY 10 APRIL","sunHeader":"SUNDAY 11 APRIL","y":2027},"12-16 April":{"cols":[{"y":2027,"m":3,"d":12},{"y":2027,"m":3,"d":13},{"y":2027,"m":3,"d":14},{"y":2027,"m":3,"d":15},{"y":2027,"m":3,"d":16}]},"WE 17&18 Apr":{"satHeader":"SATURDAY 17 APRIL","sunHeader":"SUNDAY 18 APRIL","y":2027},"19-23 April":{"cols":[{"y":2027,"m":3,"d":19},{"y":2027,"m":3,"d":20},{"y":2027,"m":3,"d":21},{"y":2027,"m":3,"d":22},{"y":2027,"m":3,"d":23}]},"WE 24&25 Apr":{"satHeader":"SATURDAY 24 APRIL","sunHeader":"SUNDAY 25 APRIL","y":2027},"26-30 April":{"cols":[{"y":2027,"m":3,"d":26},{"y":2027,"m":3,"d":27},{"y":2027,"m":3,"d":28},{"y":2027,"m":3,"d":29},{"y":2027,"m":3,"d":30}]},"WE 1&2 May":{"satHeader":"SATURDAY 1 MAY","sunHeader":"SUNDAY 2 MAY","y":2027},"3-7 May":{"cols":[{"y":2027,"m":4,"d":3},{"y":2027,"m":4,"d":4},{"y":2027,"m":4,"d":5},{"y":2027,"m":4,"d":6},{"y":2027,"m":4,"d":7}]},"WE 8&9 May":{"satHeader":"SATURDAY 8 MAY","sunHeader":"SUNDAY 9 MAY","y":2027},"10-14 May":{"cols":[{"y":2027,"m":4,"d":10},{"y":2027,"m":4,"d":11},{"y":2027,"m":4,"d":12},{"y":2027,"m":4,"d":13},{"y":2027,"m":4,"d":14}]},"WE 15&16 May":{"satHeader":"SATURDAY 15 MAY","sunHeader":"SUNDAY 16 MAY","y":2027},"17-21 May":{"cols":[{"y":2027,"m":4,"d":17},{"y":2027,"m":4,"d":18},{"y":2027,"m":4,"d":19},{"y":2027,"m":4,"d":20},{"y":2027,"m":4,"d":21}]},"WE 22&23 May":{"satHeader":"SATURDAY 22 MAY","sunHeader":"SUNDAY 23 MAY","y":2027},"24-28 May":{"cols":[{"y":2027,"m":4,"d":24},{"y":2027,"m":4,"d":25},{"y":2027,"m":4,"d":26},{"y":2027,"m":4,"d":27},{"y":2027,"m":4,"d":28}]},"WE 29&30 May":{"satHeader":"SATURDAY 29 MAY","sunHeader":"SUNDAY 30 MAY","y":2027},"31 May - 4 June":{"cols":[{"y":2027,"m":4,"d":31},{"y":2027,"m":5,"d":1},{"y":2027,"m":5,"d":2},{"y":2027,"m":5,"d":3},{"y":2027,"m":5,"d":4}]},"WE 5&6 Jun":{"satHeader":"SATURDAY 5 JUNE","sunHeader":"SUNDAY 6 JUNE","y":2027},"7-11 June":{"cols":[{"y":2027,"m":5,"d":7},{"y":2027,"m":5,"d":8},{"y":2027,"m":5,"d":9},{"y":2027,"m":5,"d":10},{"y":2027,"m":5,"d":11}]},"WE 12&13 Jun":{"satHeader":"SATURDAY 12 JUNE","sunHeader":"SUNDAY 13 JUNE","y":2027},"14-18 June":{"cols":[{"y":2027,"m":5,"d":14},{"y":2027,"m":5,"d":15},{"y":2027,"m":5,"d":16},{"y":2027,"m":5,"d":17},{"y":2027,"m":5,"d":18}]},"WE 19&20 Jun":{"satHeader":"SATURDAY 19 JUNE","sunHeader":"SUNDAY 20 JUNE","y":2027},"21-25 June":{"cols":[{"y":2027,"m":5,"d":21},{"y":2027,"m":5,"d":22},{"y":2027,"m":5,"d":23},{"y":2027,"m":5,"d":24},{"y":2027,"m":5,"d":25}]},"WE 26&27 Jun":{"satHeader":"SATURDAY 26 JUNE","sunHeader":"SUNDAY 27 JUNE","y":2027},"28 June - 2 July":{"cols":[{"y":2027,"m":5,"d":28},{"y":2027,"m":5,"d":29},{"y":2027,"m":5,"d":30},{"y":2027,"m":6,"d":1},{"y":2027,"m":6,"d":2}]},"WE 3&4 Jul":{"satHeader":"SATURDAY 3 JULY","sunHeader":"SUNDAY 4 JULY","y":2027},"5-9 July":{"cols":[{"y":2027,"m":6,"d":5},{"y":2027,"m":6,"d":6},{"y":2027,"m":6,"d":7},{"y":2027,"m":6,"d":8},{"y":2027,"m":6,"d":9}]},"WE 10&11 Jul":{"satHeader":"SATURDAY 10 JULY","sunHeader":"SUNDAY 11 JULY","y":2027},"12-16 July":{"cols":[{"y":2027,"m":6,"d":12},{"y":2027,"m":6,"d":13},{"y":2027,"m":6,"d":14},{"y":2027,"m":6,"d":15},{"y":2027,"m":6,"d":16}]},"WE 17&18 Jul":{"satHeader":"SATURDAY 17 JULY","sunHeader":"SUNDAY 18 JULY","y":2027},"19-23 July":{"cols":[{"y":2027,"m":6,"d":19},{"y":2027,"m":6,"d":20},{"y":2027,"m":6,"d":21},{"y":2027,"m":6,"d":22},{"y":2027,"m":6,"d":23}]},"WE 24&25 Jul":{"satHeader":"SATURDAY 24 JULY","sunHeader":"SUNDAY 25 JULY","y":2027},"26-30 July":{"cols":[{"y":2027,"m":6,"d":26},{"y":2027,"m":6,"d":27},{"y":2027,"m":6,"d":28},{"y":2027,"m":6,"d":29},{"y":2027,"m":6,"d":30}]},"WE 31 Jul 1 Aug":{"satHeader":"SATURDAY 31 JULY","sunHeader":"SUNDAY 1 AUGUST","y":2027},"2-6 August":{"cols":[{"y":2027,"m":7,"d":2},{"y":2027,"m":7,"d":3},{"y":2027,"m":7,"d":4},{"y":2027,"m":7,"d":5},{"y":2027,"m":7,"d":6}]},"WE 7&8 Aug":{"satHeader":"SATURDAY 7 AUGUST","sunHeader":"SUNDAY 8 AUGUST","y":2027},"9-13 August":{"cols":[{"y":2027,"m":7,"d":9},{"y":2027,"m":7,"d":10},{"y":2027,"m":7,"d":11},{"y":2027,"m":7,"d":12},{"y":2027,"m":7,"d":13}]},"WE 14&15 Aug":{"satHeader":"SATURDAY 14 AUGUST","sunHeader":"SUNDAY 15 AUGUST","y":2027},"16-20 August":{"cols":[{"y":2027,"m":7,"d":16},{"y":2027,"m":7,"d":17},{"y":2027,"m":7,"d":18},{"y":2027,"m":7,"d":19},{"y":2027,"m":7,"d":20}]},"WE 21&22 Aug":{"satHeader":"SATURDAY 21 AUGUST","sunHeader":"SUNDAY 22 AUGUST","y":2027},"23-27 August":{"cols":[{"y":2027,"m":7,"d":23},{"y":2027,"m":7,"d":24},{"y":2027,"m":7,"d":25},{"y":2027,"m":7,"d":26},{"y":2027,"m":7,"d":27}]},"WE 28&29 Aug":{"satHeader":"SATURDAY 28 AUGUST","sunHeader":"SUNDAY 29 AUGUST","y":2027},"30 August - 3 September":{"cols":[{"y":2027,"m":7,"d":30},{"y":2027,"m":7,"d":31},{"y":2027,"m":8,"d":1},{"y":2027,"m":8,"d":2},{"y":2027,"m":8,"d":3}]},"WE 4&5 Sep":{"satHeader":"SATURDAY 4 SEPTEMBER","sunHeader":"SUNDAY 5 SEPTEMBER","y":2027},"6-10 September":{"cols":[{"y":2027,"m":8,"d":6},{"y":2027,"m":8,"d":7},{"y":2027,"m":8,"d":8},{"y":2027,"m":8,"d":9},{"y":2027,"m":8,"d":10}]},"WE 11&12 Sep":{"satHeader":"SATURDAY 11 SEPTEMBER","sunHeader":"SUNDAY 12 SEPTEMBER","y":2027},"13-17 September":{"cols":[{"y":2027,"m":8,"d":13},{"y":2027,"m":8,"d":14},{"y":2027,"m":8,"d":15},{"y":2027,"m":8,"d":16},{"y":2027,"m":8,"d":17}]},"WE 18&19 Sep":{"satHeader":"SATURDAY 18 SEPTEMBER","sunHeader":"SUNDAY 19 SEPTEMBER","y":2027},"20-24 September":{"cols":[{"y":2027,"m":8,"d":20},{"y":2027,"m":8,"d":21},{"y":2027,"m":8,"d":22},{"y":2027,"m":8,"d":23},{"y":2027,"m":8,"d":24}]},"WE 25&26 Sep":{"satHeader":"SATURDAY 25 SEPTEMBER","sunHeader":"SUNDAY 26 SEPTEMBER","y":2027},"27 September - 1 October":{"cols":[{"y":2027,"m":8,"d":27},{"y":2027,"m":8,"d":28},{"y":2027,"m":8,"d":29},{"y":2027,"m":8,"d":30},{"y":2027,"m":9,"d":1}]},"WE 2&3 Oct":{"satHeader":"SATURDAY 2 OCTOBER","sunHeader":"SUNDAY 3 OCTOBER","y":2027},"4-8 October":{"cols":[{"y":2027,"m":9,"d":4},{"y":2027,"m":9,"d":5},{"y":2027,"m":9,"d":6},{"y":2027,"m":9,"d":7},{"y":2027,"m":9,"d":8}]},"WE 9&10 Oct":{"satHeader":"SATURDAY 9 OCTOBER","sunHeader":"SUNDAY 10 OCTOBER","y":2027},"11-15 October":{"cols":[{"y":2027,"m":9,"d":11},{"y":2027,"m":9,"d":12},{"y":2027,"m":9,"d":13},{"y":2027,"m":9,"d":14},{"y":2027,"m":9,"d":15}]},"WE 16&17 Oct":{"satHeader":"SATURDAY 16 OCTOBER","sunHeader":"SUNDAY 17 OCTOBER","y":2027},"18-22 October":{"cols":[{"y":2027,"m":9,"d":18},{"y":2027,"m":9,"d":19},{"y":2027,"m":9,"d":20},{"y":2027,"m":9,"d":21},{"y":2027,"m":9,"d":22}]},"WE 23&24 Oct":{"satHeader":"SATURDAY 23 OCTOBER","sunHeader":"SUNDAY 24 OCTOBER","y":2027},"25-29 October":{"cols":[{"y":2027,"m":9,"d":25},{"y":2027,"m":9,"d":26},{"y":2027,"m":9,"d":27},{"y":2027,"m":9,"d":28},{"y":2027,"m":9,"d":29}]},"WE 30&31 Oct":{"satHeader":"SATURDAY 30 OCTOBER","sunHeader":"SUNDAY 31 OCTOBER","y":2027},"1-5 November":{"cols":[{"y":2027,"m":10,"d":1},{"y":2027,"m":10,"d":2},{"y":2027,"m":10,"d":3},{"y":2027,"m":10,"d":4},{"y":2027,"m":10,"d":5}]},"WE 6&7 Nov":{"satHeader":"SATURDAY 6 NOVEMBER","sunHeader":"SUNDAY 7 NOVEMBER","y":2027},"8-12 November":{"cols":[{"y":2027,"m":10,"d":8},{"y":2027,"m":10,"d":9},{"y":2027,"m":10,"d":10},{"y":2027,"m":10,"d":11},{"y":2027,"m":10,"d":12}]},"WE 13&14 Nov":{"satHeader":"SATURDAY 13 NOVEMBER","sunHeader":"SUNDAY 14 NOVEMBER","y":2027},"15-19 November":{"cols":[{"y":2027,"m":10,"d":15},{"y":2027,"m":10,"d":16},{"y":2027,"m":10,"d":17},{"y":2027,"m":10,"d":18},{"y":2027,"m":10,"d":19}]},"WE 20&21 Nov":{"satHeader":"SATURDAY 20 NOVEMBER","sunHeader":"SUNDAY 21 NOVEMBER","y":2027},"22-26 November":{"cols":[{"y":2027,"m":10,"d":22},{"y":2027,"m":10,"d":23},{"y":2027,"m":10,"d":24},{"y":2027,"m":10,"d":25},{"y":2027,"m":10,"d":26}]},"WE 27&28 Nov":{"satHeader":"SATURDAY 27 NOVEMBER","sunHeader":"SUNDAY 28 NOVEMBER","y":2027},"29 November - 3 December":{"cols":[{"y":2027,"m":10,"d":29},{"y":2027,"m":10,"d":30},{"y":2027,"m":11,"d":1},{"y":2027,"m":11,"d":2},{"y":2027,"m":11,"d":3}]},"WE 4&5 Dec":{"satHeader":"SATURDAY 4 DECEMBER","sunHeader":"SUNDAY 5 DECEMBER","y":2027},"6-10 December":{"cols":[{"y":2027,"m":11,"d":6},{"y":2027,"m":11,"d":7},{"y":2027,"m":11,"d":8},{"y":2027,"m":11,"d":9},{"y":2027,"m":11,"d":10}]},"WE 11&12 Dec":{"satHeader":"SATURDAY 11 DECEMBER","sunHeader":"SUNDAY 12 DECEMBER","y":2027},"13-17 December":{"cols":[{"y":2027,"m":11,"d":13},{"y":2027,"m":11,"d":14},{"y":2027,"m":11,"d":15},{"y":2027,"m":11,"d":16},{"y":2027,"m":11,"d":17}]},"WE 18&19 Dec":{"satHeader":"SATURDAY 18 DECEMBER","sunHeader":"SUNDAY 19 DECEMBER","y":2027},"20-24 December":{"cols":[{"y":2027,"m":11,"d":20},{"y":2027,"m":11,"d":21},{"y":2027,"m":11,"d":22},{"y":2027,"m":11,"d":23},{"y":2027,"m":11,"d":24}]},"WE 25&26 Dec":{"blocked":"See Christmas rota","satHeader":"SATURDAY 25 DECEMBER","sunHeader":"SUNDAY 26 DECEMBER","y":2027},"27-31 December":{"cols":[{"y":2027,"m":11,"d":27},{"y":2027,"m":11,"d":28},{"y":2027,"m":11,"d":29},{"y":2027,"m":11,"d":30},{"y":2027,"m":11,"d":31}],"blocked":"See Christmas rota"}}'::jsonb;
$calendar$;

create or replace function private.rota_summary_date(p_label text,p_year integer)
returns date language plpgsql immutable set search_path='' as $$
declare parts text[]; mo integer;
begin
 parts:=pg_catalog.regexp_match(p_label,'([0-9]{1,2})[[:space:]]*([A-Za-z]{3})');
 if parts is null then return null;end if;
 mo:=pg_catalog.array_position(array['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],lower(parts[2]));
 if mo is null then return null;end if;
 return pg_catalog.make_date(p_year,mo,parts[1]::integer);
end $$;

create or replace function private.rota_summary_days(p_data jsonb)
returns table(colkey text,day date) language plpgsql immutable set search_path='' as $$
declare c jsonb; i integer:=0; y integer:=coalesce((p_data->>'y')::integer,2027); prev integer:=0; mo integer; sat date;sun date;
begin
 if coalesce((p_data->>'special')::boolean,false) then
  for c in select value from pg_catalog.jsonb_array_elements(coalesce(p_data->'cols','[]')) loop
   day:=private.rota_summary_date(coalesce(c->>'sub',c->>'lbl'),y);
   if day is not null then
    mo:=extract(month from day)::integer;
    if prev>mo then y:=y+1;day:=private.rota_summary_date(coalesce(c->>'sub',c->>'lbl'),y);end if;
    prev:=mo;colkey:=c->>'key';return next;
   end if;
  end loop;
 elsif p_data ? 'sections' then
  for c in select value from pg_catalog.jsonb_array_elements(coalesce(p_data->'cols','[]')) loop
   day:=pg_catalog.make_date(coalesce((c->>'y')::integer,y),(c->>'m')::integer+1,(c->>'d')::integer);
   colkey:=i::text;i:=i+1;return next;
  end loop;
 else
  sat:=private.rota_summary_date(p_data->>'satHeader',y);sun:=private.rota_summary_date(p_data->>'sunHeader',y);
  if sat is not null and sun<sat then sun:=private.rota_summary_date(p_data->>'sunHeader',y+1);end if;
  if sat is not null then colkey:='sat';day:=sat;return next;end if;
  if sun is not null then colkey:='sun';day:=sun;return next;end if;
  day:=coalesce(private.rota_summary_date(p_data->>'friHeader',y),sat-1);colkey:='fri';if day is not null then return next;end if;
  day:=coalesce(private.rota_summary_date(p_data->>'monHeader',coalesce(extract(year from sun)::integer,y)),sun+1);colkey:='mon';if day is not null then return next;end if;
 end if;
end $$;

create or replace function private.rota_summary_events()
returns table(kind text,day date,person text,office text)
language plpgsql stable security definer set search_path='' as $$
declare w record; dt record; sec jsonb;r jsonb;d jsonb;nm text;si integer;ri integer;
 offices jsonb:='{}';voids jsonb:='{}';gone jsonb:='[]';extras jsonb:='[]';yr text[];cal jsonb:=private.rota_summary_calendar(); kv record;
 bh date[]:=array['2027-01-01','2027-03-26','2027-03-29','2027-05-03','2027-05-31','2027-08-30','2027-12-27','2027-12-28']::date[];
begin
 select coalesce(json_text::jsonb,'{}') into voids from private.rota_entries where key='settings:cellVoid' and not deleted;
 select coalesce(json_text::jsonb,'[]') into gone from private.rota_entries where key='settings:deletedWeeks' and not deleted;
 select coalesce(json_text::jsonb,'[]') into extras from private.rota_entries where key='settings:extraWeeks' and not deleted;
 for kv in select e.key,e.value from private.rota_entries t cross join lateral pg_catalog.jsonb_each_text(t.json_text::jsonb) e where t.key='settings:offices' and not t.deleted loop
  offices:=offices||pg_catalog.jsonb_build_object(lower(trim(kv.key)),kv.value);
 end loop;
 for w in select substr(key,6) id,json_text::jsonb data from private.rota_entries where key like 'week:%' and not deleted loop
  if coalesce(gone,'[]') ? w.id then continue;end if;
  d:=coalesce(cal->w.id,'{}')||w.data;
  if not (d ? 'y') then
   yr:=pg_catalog.regexp_match(coalesce((select value->>'name' from pg_catalog.jsonb_array_elements(coalesce(extras,'[]')) where value->>'id'=w.id limit 1),w.id),'(?:19|20)[0-9]{2}');
   if yr is not null then d:=d||pg_catalog.jsonb_build_object('y',yr[1]::integer);end if;
  end if;
  for dt in select * from private.rota_summary_days(d) loop
   day:=dt.day;
   if d ? 'sections' and not coalesce((d->>'special')::boolean,false) then
    si:=0;
    for sec in select value from pg_catalog.jsonb_array_elements(d->'sections') loop
     ri:=0;
     for r in select value from pg_catalog.jsonb_array_elements(sec->'rows') loop
      if r->>'type'='role' then
       nm:=trim(coalesce(r->'assign'->>dt.colkey::integer,''));
       if nm<>'' then
        kind:=case when coalesce((sec->>'holiday')::boolean,false) then 'holiday' else 'work' end;
        person:=lower(nm);office:=offices->>person;
        if kind='holiday' or (coalesce(d->>'blocked','')='' and not (day=any(bh)) and coalesce(voids->>(w.id||'|'||si||'|'||ri||'|'||dt.colkey),'false')<>'true') then return next;end if;
       end if;
      end if;
      ri:=ri+1;
     end loop;
     si:=si+1;
    end loop;
   else
    ri:=0;
    for r in select value from pg_catalog.jsonb_array_elements(coalesce(d->'rows','[]')) loop
     nm:=trim(coalesce(case when coalesce((d->>'special')::boolean,false) then r->'vals'->>dt.colkey else r->>dt.colkey end,''));
     if nm<>'' and coalesce(d->>'blocked','')='' and coalesce(voids->>(w.id||'|we|'||ri||'|'||dt.colkey),'false')<>'true' then kind:='work';person:=lower(nm);office:=offices->>person;return next;end if;
     ri:=ri+1;
    end loop;
    for r in select value from pg_catalog.jsonb_array_elements(coalesce(d->'awayRows','[]')) loop
     nm:=trim(coalesce(case when coalesce((d->>'special')::boolean,false) then r->'vals'->>dt.colkey else r->>dt.colkey end,''));
     if nm<>'' then kind:='holiday';person:=lower(nm);office:=offices->>person;return next;end if;
    end loop;
   end if;
  end loop;
 end loop;
end $$;

create or replace function public.rota_public_summary(p_since_rev bigint default -1,p_client_epoch bigint default -1)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare m private.rota_meta%rowtype; result jsonb;
begin
 select * into m from private.rota_meta where id=1;
 if p_since_rev=m.rev and p_client_epoch=m.epoch then return pg_catalog.jsonb_build_object('ok',true,'unchanged',true,'rev',m.rev,'epoch',m.epoch);end if;
 with events as materialized (select distinct kind,day,person,office from private.rota_summary_events()),
 totals as (select kind,case when kind='holiday' then '' else office end office,
 extract(year from day)::integer||'-'||(extract(month from day)::integer-1)||'-'||extract(day from day)::integer daykey,count(distinct person)::integer n
 from events where kind='holiday' or coalesce(office,'')<>'' group by 1,2,3),
 office_totals as (select office,pg_catalog.jsonb_object_agg(daykey,n) days from totals where kind='work' group by office)
 select pg_catalog.jsonb_build_object('holidays',coalesce((select pg_catalog.jsonb_object_agg(daykey,n) from totals where kind='holiday'),'{}'),
 'offices',coalesce((select pg_catalog.jsonb_object_agg(office,days) from office_totals),'{}')) into result;
 return pg_catalog.jsonb_build_object('ok',true,'rev',m.rev,'epoch',m.epoch,'data',result);
end $$;
revoke all on function private.rota_summary_calendar() from public,anon,authenticated;
revoke all on function private.rota_summary_date(text,integer) from public,anon,authenticated;
revoke all on function private.rota_summary_days(jsonb) from public,anon,authenticated;
revoke all on function private.rota_summary_events() from public,anon,authenticated;
revoke all on function public.rota_public_summary(bigint,bigint) from public;
grant execute on function public.rota_public_summary(bigint,bigint) to anon,authenticated;
notify pgrst,'reload schema';
commit;
