import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create schema private; create role anon;create role authenticated;
create table private.rota_meta(id int primary key,rev bigint,epoch bigint);insert into private.rota_meta values(1,20,0);
create table private.rota_entries(key text primary key,rev bigint default 20,deleted boolean default false,json_text text);
revoke all on schema private from public;`);
await db.exec(fs.readFileSync(new URL('../upgrade_public_totals.sql',import.meta.url),'utf8'));
const entry=async(k,v)=>db.query('insert into private.rota_entries(key,json_text) values($1,$2) on conflict(key) do update set json_text=excluded.json_text',[k,JSON.stringify(v)]);
const week={cols:[{y:2027,m:0,d:4},{y:2027,m:0,d:5}],sections:[{title:'News',rows:[{type:'role',assign:['Alice Example','Alice Example']},{type:'role',assign:['Alice Example','Bob Example']}]},{title:'Away',holiday:true,rows:[{type:'role',assign:['Bob Example','Alice Example']},{type:'role',assign:['bob example','']}]}]};
await entry('week:4-8 January',week);await entry('settings:public',{'4-8 January':false});await entry('settings:offices',{'Alice Example':'London','Bob Example':'London'});
let summary=(await db.query('select public.rota_public_summary() v')).rows[0].v;
assert.deepEqual(summary.data,{namesIncluded:true,boothsIncluded:true,booths:{},holidays:{'2027-0-4':1,'2027-0-5':1},holidayNames:{'2027-0-4':['Bob Example'],'2027-0-5':['Alice Example']},offices:{London:{'2027-0-4':1,'2027-0-5':2}},officeNames:{London:{'2027-0-4':['Alice Example'],'2027-0-5':['Alice Example','Bob Example']}}});
assert(!JSON.stringify(summary).includes('assign')); 
await db.exec('set role anon');
assert.deepEqual((await db.query('select public.rota_public_summary() v')).rows[0].v,summary);
await assert.rejects(db.query('select * from private.rota_entries'));
await assert.rejects(db.query('select * from private.rota_summary_events()'));
await assert.rejects(db.query('select * from private.rota_summary_booth_events()'));
await db.exec('reset role');
assert.equal((await db.query('select public.rota_public_summary($1,0) v',[summary.rev])).rows[0].v.unchanged,true);
await entry('settings:public',{'4-8 January':true});
assert.deepEqual((await db.query('select public.rota_public_summary() v')).rows[0].v.data,summary.data);
await entry('week:WE 9&10 Jan',{y:2027,satHeader:'9 JANUARY',sunHeader:'10 JANUARY',rows:[{role:'Editor',sat:'Alice Example',sun:'Bob Example'}],awayRows:[{sat:'Bob Example',sun:'Alice Example'}]});
await entry('week:Christmas',{y:2027,special:true,cols:[{key:'d1',sub:'31 Dec'},{key:'d2',sub:'1 Jan'}],rows:[{role:'Editor',vals:{d1:'Alice Example',d2:'Bob Example'}}],awayRows:[{vals:{d1:'Bob Example',d2:'Alice Example'}}]});
summary=(await db.query('select public.rota_public_summary() v')).rows[0].v;
assert.equal(summary.data.holidays['2027-0-9'],1);assert.equal(summary.data.holidays['2028-0-1'],1);assert.equal(summary.data.offices.London['2028-0-1'],1);
await entry('settings:cellVoid',{'4-8 January|0|0|0':true,'4-8 January|0|1|0':true});
assert.equal((await db.query('select public.rota_public_summary() v')).rows[0].v.data.offices.London['2027-0-4'],undefined);
await entry('settings:deletedWeeks',['WE 9&10 Jan']);
assert.equal((await db.query('select public.rota_public_summary() v')).rows[0].v.data.holidays['2027-0-9'],undefined);
await entry('settings:extraWeeks',[{id:'special-future',name:'Christmas 2029',kind:'weekend'}]);
await entry('week:special-future',{special:true,cols:[{key:'x',sub:'25 Dec'}],rows:[],awayRows:[{vals:{x:'Alice Example'}}]});
assert.equal((await db.query('select public.rota_public_summary() v')).rows[0].v.data.holidays['2029-11-25'],1);
await db.exec(fs.readFileSync(new URL('../upgrade_public_totals.sql',import.meta.url),'utf8'));
console.log('PASS: counts include hidden weeks; holiday and office names included for Staff; private tables denied; visibility-independent totals; deduplication; weekends; special year rollover; void/deleted filtering; unchanged response; repeatable SQL upgrade.');
const role=(area,slot,name)=>({type:'role',area,slot,assign:[name,name]});
const boothWeek={cols:[{y:2027,m:0,d:4},{y:2027,m:0,d:1}],sections:[
 {title:'FOCUS ONE',rows:[role('NEWS EDITOR','ALL','Ignored'),role('PATCH','AM','Alice Example'),role('','PM','Bob Example'),role('OTHER','AM','alice example')]},
 {title:'NATIONALS & LONDON',rows:[role('Behind the Headlines','AM','Ignored'),role('','PM','Ignored'),{type:'subhead',label:'National'},role('NATIONAL','AM','Dana Example')]},
 {title:'HUB NORTH',rows:[role('DELIVERY','AM','Carol Example'),role('','PM','Bob Example'),role('AWARENESS','AM','Ignored')]},
 {title:'FOCUS Away',holiday:true,rows:[role('PATCH','AM','Ignored')]},
 {title:'CREATION',rows:[role('PATCH','AM','Ignored')]}
]};
await entry('week:booth-test',boothWeek);await entry('settings:public',{'booth-test':false});
await entry('settings:offices',Object.fromEntries(['Alice Example','Bob Example','Carol Example','Dana Example','Ignored'].map(n=>[n,'London'])));
await db.exec('set role anon');
let boothSummary=(await db.query('select public.rota_public_summary() v')).rows[0].v;
assert.deepEqual(boothSummary.data.booths.AM.London['2027-0-4'],{count:3,names:['Alice Example','Carol Example','Dana Example']});
assert.deepEqual(boothSummary.data.booths.PM.London['2027-0-4'],{count:1,names:['Bob Example']});
assert.equal(boothSummary.data.booths.AM.London['2027-0-1'],undefined);
await db.exec('reset role');
await entry('settings:public',{'booth-test':true});assert.deepEqual((await db.query('select public.rota_public_summary() v')).rows[0].v.data.booths,boothSummary.data.booths);
await entry('settings:cellVoid',{'booth-test|0|1|0':true,'booth-test|0|3|0':true});
assert.equal((await db.query('select public.rota_public_summary() v')).rows[0].v.data.booths.AM.London['2027-0-4'].count,2);
await entry('week:booth-test',{...boothWeek,blocked:'See special rota'});assert.deepEqual((await db.query('select public.rota_public_summary() v')).rows[0].v.data.booths,{});
console.log('PASS: anonymous booth names/counts match across publication states; AM/PM classification; inherited role areas; case-insensitive deduplication; excluded roles, Away, void cells, blocked pages and bank holidays.');
await db.close();
