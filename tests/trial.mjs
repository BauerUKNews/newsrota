import {PGlite} from '@electric-sql/pglite';import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite({extensions:{pgcrypto}});await db.exec('create schema extensions;create role anon;create role authenticated;');
for(const path of [new URL('./fixtures/setup.sql',import.meta.url),new URL('./fixtures/upgrade_concurrent_editing.sql',import.meta.url),new URL('./fixtures/upgrade_public_totals_v18_2.sql',import.meta.url)])await db.exec(fs.readFileSync(path,'utf8'));
const put=(key,v)=>db.query('insert into private.rota_entries(key,rev,json_text) values($1,10,$2) on conflict(key) do update set json_text=excluded.json_text,rev=10',[key,JSON.stringify(v)]);
await put('settings:allowances',{Alice:30,Bob:0});await put('settings:roster',['Alice','Bob','Carol']);await put('settings:public',{'4-8 January':true,'trial-2026-11-01':true});await put('week:4-8 January',{sections:[],notes:['preserve existing 2027 data']});await db.exec('update private.rota_meta set rev=10');
const upgrade=fs.readFileSync(new URL('../upgrade_public_totals.sql',import.meta.url),'utf8');await db.exec(upgrade);
const read=async k=>JSON.parse((await db.query('select json_text from private.rota_entries where key=$1',[k])).rows[0].json_text);
let a=await read('settings:allowances');assert.deepEqual(a,{Alice:30,Bob:0,__years:{2026:{Alice:30,Bob:0,Carol:28}}});
const pub=await read('settings:public');assert.equal(pub['trial-2026-11-01'],true);assert.equal(pub['trial-2026-11-02'],false);assert.equal(pub['4-8 January'],true);assert.equal(Object.keys(pub).filter(k=>k.startsWith('trial-')).length,16);
assert.equal((await read('week:4-8 January')).notes[0],'preserve existing 2027 data');assert.equal((await db.query('select rev from private.rota_meta')).rows[0].rev,11);
await db.exec(upgrade);assert.equal((await db.query('select rev from private.rota_meta')).rows[0].rev,11);
a.Alice=35;a.__years[2026].Bob=5;await put('settings:allowances',a);await db.exec(upgrade);a=await read('settings:allowances');assert.equal(a.__years[2026].Alice,30);assert.equal(a.__years[2026].Bob,5);assert.equal(a.Alice,35);
await db.exec('set role anon');const staff=(await db.query("select public.rota_get_bootstrap('') v")).rows[0].v;assert.equal(staff.data['settings:allowances'],undefined);await db.exec('reset role');
await put('settings:offices',{Alice:'London',Bob:'London'});
const raw=JSON.parse(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').split('\n').find(l=>l.startsWith('const RAW = ')).replace(/^const RAW = /,'').replace(/;\s*$/,''));
for(const id of ['trial-2026-11-02','trial-2026-12-21']){
 const d=structuredClone(raw.weekdayTemplate);Object.assign(d,raw.weekMeta[id]);const n=d.cols.length;d.sections.forEach(s=>s.rows.forEach(r=>{if(r.type==='role')r.assign=Array(n).fill('')}));d.sections.find(s=>s.holiday).rows[0].assign=Array(n).fill('Bob');d.sections.find(s=>/^FOCUS/.test(s.title)).rows.find(r=>r.slot==='AM').assign=Array(n).fill('Alice');await put('week:'+id,d);
}
const sunday=structuredClone(raw.weeksData['trial-2026-11-01']);sunday.rows[0].vals.sun='Alice';sunday.awayRows=[{vals:{sun:'Bob'}}];await put('week:trial-2026-11-01',sunday);
await db.exec('set role anon');const totals=(await db.query('select public.rota_public_summary() v')).rows[0].v.data;
assert.deepEqual(totals.holidayNames['2026-10-1'],['Bob']);assert.equal(totals.offices.London['2026-10-1'],1);assert.deepEqual(totals.booths.AM.London['2026-10-2'],{count:1,names:['Alice']});assert.equal(totals.holidays['2026-11-24'],1);assert.equal(totals.holidays['2026-11-25'],undefined);assert.equal(totals.booths.AM.London['2027-11-24'],undefined);
console.log('PASS: 2026 allowance snapshot, independent edits, default/zero values, idempotent upgrade, private allowance filtering, 16 trial visibility defaults, preserved publication choices/2027 data, Sunday and partial-week public holiday/office/booth summaries.');await db.close();
