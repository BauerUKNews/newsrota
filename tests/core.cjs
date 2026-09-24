const fs=require('fs'), vm=require('vm'), assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
function extract(name){
 const start=source.indexOf('function '+name+'(');assert(start>=0,name);
 let end=source.indexOf('\n',start);
 for(;end>=0;end=source.indexOf('\n',end+1)){
  const part=source.slice(start,end);
  try{new vm.Script(part);return part;}catch(e){if(!(e instanceof SyntaxError))throw e;}
 }
 throw Error('Cannot extract '+name);
}
const clone=x=>JSON.parse(JSON.stringify(x));
const results=[];
function base(names=[]){
 const els={};const c={saveBroken:false,console,Date,Set,Map,JSON,Math,Number,String,Object,Array,clone,
  UI22:{personalRange:'upcoming',personalName:'',summaryMonth:{},yearOverview:false},
  store:{schema:10,resetEpoch:0,overrides:{a:{value:'old'},b:{value:'old'}},public:{},allowances:{},cellNotes:{},cellColors:{},cellVoid:{},cellCover:{},roster:[],templates:[],rules:[],rotations:[],extraWeeks:[],deletedWeeks:[],offices:{},freelance:{},key:[]},
  state:{editing:true,role:'ops',view:'rota',idx:0,templateMode:false},SCHEMA:10,LSKEY:'cache',YEAR:2027,MONIDX:{jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11},
  SYNC:{on:true,canEdit:true,serverRole:'ops',authToken:'test-token',rev:9,epoch:0,keyRev:{},shadow:{},dirty:false,saving:false,pending:false,refreshing:false,conflict:false,bootstrapped:true,generation:0,polling:false,lastError:''},
  sent:[],timers:[],alerts:[],storage:{},localStorage:{setItem(k,v){c.storage[k]=v}},sessionStorage:{setItem(){},removeItem(){}},
  document:{activeElement:null},clearRoleCache(){},persistLocal(){c.storage.cache=JSON.stringify(c.store);return true},enforcePhoneStaff(){return true},requestAnimationFrame(){},renderCurrentView(){},rebuildWeeks(){},buildWeekSel(){},updateUndoUI(){},updateSaveUI(){},flash(){},alert(s){c.alerts.push(s)},
  setTimeout(fn,ms){const t={fn,ms,id:c.timers.length+1};c.timers.push(t);return t.id},clearTimeout(){},clearInterval(){},
  gasCall(name,args,ok,fail){c.sent.push({name,args,ok,fail})},saveAccessToken(){},handleEpochMismatch(){throw Error('unexpected epoch')},
  setEditing(on){c.state.editing=on},releaseLease(){},refreshBootstrap(){},hideBackendBanner(){c.banner=false},showBackendBanner(){c.banner=true},
  SYNC_DEBOUNCE:1200,SYNC_POLL_EDIT:12000,SYNC_POLL_VIEW:20000,MAXH:60,HIST:[],HI:-1,historyAnchor:{},restoring:false,selKeys:new Set(),
  $:s=>els[s]||(els[s]={className:'',textContent:'',classList:{add(){},remove(){}},disabled:false}),
  RAW:{weekdayTemplate:{sections:[]},weeks:[{id:'a',name:'4-8 January',kind:'weekday'}],weeksData:{},rosterDefaults:[]},
  canViewWeek(){return true},isBankHol(){return false},nrm:s=>String(s??'').trim().toLowerCase(),canonName:s=>s,
  week(){return c.RAW.weeks[c.state.idx]},data(){return c.store.overrides[c.week().id]},template(w){return c.RAW.weeksData[w.id]},
  invalidateAutofillPreview(){},cancelFillDrag(){},closeRestrictedViews(){},refreshPublicSummary(){},publicTotals:(k,v)=>v,remapAutofillMarkers(){},render(){},closeAutofill(){c.AUTOPLAN=null},initialWeekIdx(){return 0},applyRole(){},initHistory(){},
  buildGenerationReport(){return {version:1}},openGenerationInfo(){},commit(){c.persist();c.recordHistory()},agoText(){return 'just now'}
 };
 vm.createContext(c);
 const all=['historySnapshot','initHistory','rebaseHistory','writeStoreKey','autofillVersion','syncSnapshot','syncDiff','scheduleFlush','persist','applyServerData','purgeRestrictedLocalData','markerWeekFromKey','resetStoreForServer','applyServerStatus','flushNow','handleConflicts','pollChanges','recordHistory','restoreHistory','undo','redo','inSummaryPeriod','seedTrialAllowances','ensureStoreDefaults','processBootstrap','updateSaveUI',...names];
 vm.runInContext([...new Set(all)].map(extract).join('\n'),c);
 c.SYNC.shadow=Object.fromEntries(Object.entries(c.syncSnapshot()).map(([k,v])=>[k,JSON.stringify(v)]));
 c.SYNC.keyRev=Object.fromEntries(Object.keys(c.SYNC.shadow).map(k=>[k,10]));
 c.initHistory();
 return c;
}
function observe(id,title,body){try{const result=body();results.push({id,title,reproduced:true,observation:result})}catch(e){results.push({id,title,reproduced:false,error:e.stack})}}
function status(extra={}){return {ok:true,epoch:0,role:'ops',canEdit:true,authValid:true,...extra}}

function test(name,body){try{body();console.log('PASS '+name)}catch(e){console.error('FAIL '+name,e.stack);process.exitCode=1;}}
const ack=(c,key,rev)=>{c.SYNC.shadow[key]=JSON.stringify(c.syncSnapshot()[key]);c.SYNC.keyRev[key]=rev;};
test('Undo queues a shared save; Redo restores only the local action',()=>{
 const c=base();c.store.overrides.a={value:'mine'};c.recordHistory();ack(c,'week:a',11);c.undo();assert.equal(c.store.overrides.a.value,'old');assert(c.SYNC.dirty);assert(c.timers.length);c.redo();assert.equal(c.store.overrides.a.value,'mine');
});
test('Undo and a later edit preserve a remotely updated unrelated week',()=>{
 const c=base();c.store.overrides.a={value:'mine'};c.recordHistory();ack(c,'week:a',11);
 c.applyServerData({'week:b':{json:'{"value":"colleague"}',rev:12}},false);c.undo();c.store.overrides.a={value:'next'};c.persist();c.flushNow();
 assert.equal(c.store.overrides.b.value,'colleague');assert(!c.sent[0].args[0].some(x=>x.key==='week:b'));
});
test('Undo refuses to overwrite a remotely changed target',()=>{
 const c=base();c.store.overrides.a={value:'mine'};c.recordHistory();ack(c,'week:a',11);c.applyServerData({'week:a':{json:'{"value":"theirs"}',rev:12}},false);c.undo();assert.equal(c.store.overrides.a.value,'theirs');assert.equal(c.HI,0);assert(c.alerts.length);
});
test('New history actions exclude remote data',()=>{
 const c=base();c.applyServerData({'week:b':{json:'{"value":"theirs"}',rev:12}},false);c.store.overrides.a={value:'mine'};c.recordHistory();assert.equal(c.HIST[0].changes.length,1);assert.equal(c.HIST[0].changes[0].key,'week:a');
});
test('Stale Autofill never queues an overwrite',()=>{
 const c=base(['applyAutofill']);c.store.overrides.a={sections:[],notes:['old']};ack(c,'week:a',10);
 c.AUTOPLAN={version:c.autofillVersion(),base:clone(c.store.overrides.a),fills:[],covers:[],gaps:[]};
 c.applyServerData({'week:a':{json:'{"sections":[],"notes":["theirs"]}',rev:12}},false);c.applyAutofill();assert.equal(c.store.overrides.a.notes[0],'theirs');assert(c.alerts.length);assert.equal(c.sent.length,0);
});
test('Current Autofill still applies',()=>{
 const c=base(['applyAutofill']);c.AUTOPLAN={version:c.autofillVersion(),base:{sections:[],notes:['new']},fills:[],covers:[],gaps:[]};c.applyAutofill();assert.equal(c.store.overrides.a.notes[0],'new');assert(c.SYNC.dirty);
});
test('Leaving Edit preserves dirty items until their save',()=>{
 const c=base();c.pollChanges();c.store.overrides.a={value:'unsaved'};c.persist();c.state.editing=false;c.sent[0].ok(status({rev:12,changes:[{key:'week:a',rev:12,json:'{"value":"remote"}'}]}));c.flushNow();assert.equal(c.store.overrides.a.value,'unsaved');const save=c.sent.find(x=>x.name==='saveChanges');assert(save);assert.equal(save.args[0].find(x=>x.key==='week:a').baseRev,10);
});
test('Late refresh cannot regress an accepted save',()=>{
 const c=base();c.pollChanges();c.store.overrides.a={value:'new'};c.persist();c.flushNow();c.sent[1].ok(status({rev:11,keyRev:{'week:a':11},conflicts:[]}));c.sent[0].ok(status({rev:10,changes:[{key:'week:a',rev:10,json:'{"value":"old"}'}]}));assert.equal(c.store.overrides.a.value,'new');assert.equal(c.SYNC.keyRev['week:a'],11);
});
test('Superseded access responses are discarded',()=>{
 const c=base();c.pollChanges();c.SYNC.generation++;c.SYNC.authToken='new-token';c.sent[0].ok(status({role:'staff',canEdit:false,authValid:false,rev:12,changes:[]}));assert.equal(c.SYNC.serverRole,'ops');
});
test('Short and duplicate-name rotations leave lower priorities unfilled',()=>{
 const c=base(['rotationAssign']);c.rotationIndex=()=>0;
 for(const names of [['Alice','Bob'],['Alice','alice','Bob']]){const r=c.rotationAssign({roles:['r1','r2','r3'],names},{},Array.from({length:5},()=>new Set()),new Set());assert.equal(Object.values(r.map).length,2);assert.equal(new Set(Object.values(r.map).map(x=>x.toLowerCase())).size,2);assert.equal(r.map.r3,undefined);}
});
test('Legacy import preserves weeks and stays on the current reset epoch',()=>{
 const c=base(['prepareImport']);const old={schema:9,resetEpoch:88,overrides:{a:{sections:[],notes:['keep']}},extraWeeks:[{id:'extra',kind:'weekday',name:'Extra'}]};const migrated=c.prepareImport(old);assert.equal(migrated.overrides.a.notes[0],'keep');assert.equal(migrated.extraWeeks.length,1);assert.equal(migrated.resetEpoch,0);assert.equal(migrated.schema,10);assert.equal(old.schema,9);
});
test('Malformed and future imports cannot mutate the live store',()=>{
 const c=base(['prepareImport']);const before=JSON.stringify(c.store);
 for(const bad of [{overrides:{},key:[null]},{overrides:{a:{cols:[{y:2027,m:40,d:1}],sections:[]}}},{schema:10,overrides:{},rotations:'invalid'},{schema:99,overrides:{}},{overrides:{a:{sections:[{title:'News',rows:[{type:'role',assign:42}]}]}}}])assert.throws(()=>c.prepareImport(bad));assert.equal(JSON.stringify(c.store),before);
});
test('Every Away date counts once across weekdays, weekends and special pages',()=>{
 const c=base(['holidayEntries','takenByPerson','specialDates','parseWeDate','heatData']);
 c.RAW.weeks=[{id:'a',kind:'weekday'},{id:'w',kind:'weekend'},{id:'s',kind:'weekend',name:'Christmas 2027'}];
 c.store.overrides={a:{sections:[{holiday:true,rows:[{type:'role',assign:['Alice']},{type:'role',assign:['alice']}]}]},w:{satHeader:'9 January',sunHeader:'10 January',rows:[],awayRows:[{sat:'Alice',sun:'Alice'}]},s:{special:true,cols:[{key:'d',sub:'31 Dec'},{key:'n',sub:'1 Jan'}],rows:[],awayRows:[{vals:{d:'Alice',n:'Alice'}}]}};
 c.colDates=()=>[new Date(2027,0,1)];c.isBankHol=()=>true;
 assert.equal(c.takenByPerson(2027).alice,4);assert.equal(c.takenByPerson(2028).alice,1);assert.equal(c.heatData()['2027-0-9'].count,1);
});
test('Failed initial bootstrap schedules full bootstrap recovery',()=>{
 const c=base();c.SYNC.bootstrapped=false;c.processBootstrap(null,false);c.timers[0].fn();assert(!c.sent.some(x=>x.name==='getChanges'));c.pollChanges();assert(!c.sent.some(x=>x.name==='getChanges'));
});
test('Public summaries show names from hidden weeks in holiday and office views',()=>{
 const c=base(['publicTotals']);c.PUBLIC_SUMMARY={data:{namesIncluded:true,holidays:{'2027-0-4':3},holidayNames:{'2027-0-4':['Alice','Bob','Carol']},offices:{London:{'2027-0-4':4}},officeNames:{London:{'2027-0-4':['Alice','Bob','Carol','Dana']}}}};
 let out=c.publicTotals('holidays',{'2027-0-4':{count:1,names:['Alice','alice']}});assert.equal(out['2027-0-4'].count,3);assert.deepEqual(Array.from(out['2027-0-4'].names),['Alice','Bob','Carol']);assert.equal(out['2027-0-4'].privateCount,0);
 out=c.publicTotals('office',{},'London');assert.equal(out['2027-0-4'].count,4);assert.deepEqual(Array.from(out['2027-0-4'].names),['Alice','Bob','Carol','Dana']);
});
test('Missing summary never presents partial visible totals as full totals',()=>{
 const c=base(['publicTotals','summaryNotice']);c.PUBLIC_SUMMARY={data:null,error:'unavailable'};assert.equal(Object.keys(c.publicTotals('holidays',{'2027-0-4':{count:1}})).length,0);assert(c.summaryNotice().includes('unavailable'));
 c.PUBLIC_SUMMARY.data={holidays:{},offices:{}};assert(c.summaryNotice().includes('last successfully loaded'));
});
test('Access downgrade clears restricted dialogs, content and Autofill',()=>{
 const c=base(['closeRestrictedViews']);let open=true;const fields=Object.fromEntries(['personBody','personSub','personName','autoBody','noteText','searchPop','officePop','boothPop','heatPop'].map(id=>[id,{textContent:'private data'}]));fields.noteText={value:'private note'};
 c.document={querySelectorAll(){return [{classList:{remove(){open=false}}}]},getElementById(id){return fields[id]},body:{classList:{remove(){}}}};c.AUTOPLAN={private:true};c.state.templateMode=true;c.closeRestrictedViews();assert.equal(open,false);assert.equal(c.AUTOPLAN,null);assert.equal(c.state.templateMode,false);Object.values(fields).forEach(e=>assert.equal('value'in e?e.value:e.textContent,''));
});
test('Current shipped week shapes remain importable',()=>{
 const c=base(['prepareImport']);const line=source.split('\n').find(l=>l.startsWith('const RAW = '));const raw=JSON.parse(line.replace(/^const RAW = /,'').replace(/;\s*$/,''));
 const imported=c.prepareImport({schema:10,overrides:{...raw.weeksData,weekday:raw.weekdayTemplate,weekend:raw.weekendTemplate},templates:[{id:'base',label:'Default',from:null,data:raw.weekdayTemplate}]});assert(imported.overrides.weekday.sections.length>0);
});
test('Every inline script parses',()=>{
 for(const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(match[1].trim())new vm.Script(match[1]);
});

test('Older counts-only SQL remains readable and clearly asks for the names upgrade',()=>{
 const c=base(['publicTotals','summaryNotice']);c.PUBLIC_SUMMARY={data:{holidays:{'2027-0-4':2},offices:{}},error:''};const out=c.publicTotals('holidays',{});assert.equal(out['2027-0-4'].count,2);assert.equal(out['2027-0-4'].names.length,0);assert(c.summaryNotice().includes('updated totals SQL'));
});
const dragModel=()=>Array.from({length:4},(_,r)=>Array.from({length:5},(_,c)=>({k:`w|1|${r}|${c}`,r:{left:c*100,right:(c+1)*100,top:r*44,bottom:(r+1)*44}}))).flat();
test('Copy direction ignores click jitter and locks to the dominant direction',()=>{
 const c=base(['fillAxis']);assert.equal(c.fillAxis(3,-4),null);assert.equal(c.fillAxis(9,8),null);assert.equal(c.fillAxis(25,-7),'x');assert.equal(c.fillAxis(5,30),'y');
});
test('Horizontal copy stays on its logical row even with pointer drift into the row above',()=>{
 const c=base(['fillGroup','fillCopyPlan']);const plan=c.fillCopyPlan(dragModel(),['w|1|1|0'],['Alice'],'x',450,20);assert.deepEqual(Array.from(plan,v=>v.key),['w|1|1|1','w|1|1|2','w|1|1|3','w|1|1|4']);assert(plan.every(v=>v.value==='Alice'));
});
test('Vertical copy stays in the source column despite sideways drift',()=>{
 const c=base(['fillGroup','fillCopyPlan']);const plan=c.fillCopyPlan(dragModel(),['w|1|0|1'],['Bob'],'y',410,155);assert.deepEqual(Array.from(plan,v=>v.key),['w|1|1|1','w|1|2|1','w|1|3|1']);
});
test('Multi-row copy repeats each row independently instead of mixing names between rows',()=>{
 const c=base(['fillGroup','fillCopyPlan']);const plan=c.fillCopyPlan(dragModel(),['w|1|1|0','w|1|2|0'],['Alice','Bob'],'x',450,0);assert.equal(plan.length,8);assert(plan.filter(v=>v.key.startsWith('w|1|1|')).every(v=>v.value==='Alice'));assert(plan.filter(v=>v.key.startsWith('w|1|2|')).every(v=>v.value==='Bob'));
});
test('Copy patterns repeat correctly leftwards and upwards without rewriting source cells',()=>{
 const c=base(['fillGroup','fillCopyPlan']);let plan=c.fillCopyPlan(dragModel(),['w|1|1|2','w|1|1|3'],['Alice','Bob'],'x',50,0);assert.deepEqual(Array.from(plan,v=>v.value),['Alice','Bob']);assert(!plan.some(v=>v.key.endsWith('|2')||v.key.endsWith('|3')));
 plan=c.fillCopyPlan(dragModel(),['w|1|2|1','w|1|3|1'],['Alice','Bob'],'y',0,20);assert.deepEqual(Array.from(plan,v=>v.value),['Alice','Bob']);
});
test('A stale drag cannot commit any copied values',()=>{
 const c=base(['finishFillDrag']);c.fillDrag={pointerId:1,version:'old',plan:[{key:'week:a',value:'overwrite'}]};let cancelled=false;c.cancelFillDrag=()=>{cancelled=true;c.fillDrag=null};let edits=0;c.edit=()=>{edits++};c.finishFillDrag({pointerId:1});assert(cancelled);assert.equal(edits,0);assert.equal(c.sent.length,0);
});

test('Cancelling a drag clears its preview and restores source selection without a save',()=>{
 const c=base(['cancelFillDrag']);let released=false,cancelled=false,restored=false;c.fillDrag={keys:['w|1|0|0'],pointerId:7,frame:9,plan:[{key:'w|1|0|1',value:'Bob'}]};c.rangeDrag={};c.grid={hasPointerCapture(){return true},releasePointerCapture(){released=true}};c.cancelAnimationFrame=()=>{cancelled=true};c.document.body={classList:{remove(){}}};c.workCells=()=>[];c.applyCellSel=()=>{restored=true};c.cancelFillDrag();assert.equal(c.fillDrag,null);assert.equal(c.rangeDrag,null);assert(released&&cancelled&&restored);assert.deepEqual(Array.from(c.selKeys),['w|1|0|0']);assert.equal(c.sent.length,0);
});

test('Booth names and counts are identical for Staff, Editor and Operations',()=>{
 const c=base(['boothData']);c.PUBLIC_SUMMARY={data:{boothsIncluded:true,booths:{AM:{London:{'2027-0-4':{count:2,names:['Alice','Bob']}}},PM:{London:{'2027-0-4':{count:1,names:['Carol']}}}}}};
 for(const role of ['staff','lead','ops']){c.state.role=role;assert.equal(c.boothData('London','AM')['2027-0-4'].count,2);assert.deepEqual(Array.from(c.boothData('London','PM')['2027-0-4'].names),['Carol']);assert.equal(Object.keys(c.boothData('Leeds','AM')).length,0);}
});
test('Missing booth upgrade cannot display partial Staff-local booth counts',()=>{
 const c=base(['boothData']);c.PUBLIC_SUMMARY={data:{namesIncluded:true}};c.boothByDay=()=>{throw Error('Must not use filtered local data')};assert.equal(Object.keys(c.boothData('London','AM')).length,0);
});
function calendarContext(){
 const c=base(['weekDates','mondayOf','weekMonday','colDates','parseWeDate','specialDates','weekDatesOf','weekRepDate','yearsInData','rotationIndex']);
 const raw=JSON.parse(source.split('\n').find(l=>l.startsWith('const RAW = ')).replace(/^const RAW = /,'').replace(/;\s*$/,''));
 raw.weeks.forEach(w=>{if(!raw.weeksData[w.id])raw.weeksData[w.id]=Object.assign(clone(w.kind==='weekday'?raw.weekdayTemplate:raw.weekendTemplate),raw.weekMeta[w.id]);});
 c.RAW=raw;c.store.overrides={};c.template=w=>raw.weeksData[w.id];return c;
}
test('Trial pages cover exactly 1 November–24 December 2026, once per date',()=>{
 const c=calendarContext(),weeks=c.RAW.weeks.filter(w=>w.id.startsWith('trial-2026-'));assert.equal(weeks.length,16);
 const dates=weeks.flatMap(w=>Array.from(c.weekDatesOf(w))).map(d=>d.toISOString().slice(0,10)).sort();assert.equal(dates.length,54);assert.equal(new Set(dates).size,54);assert.equal(dates[0],'2026-11-01');assert.equal(dates.at(-1),'2026-12-24');
 assert.equal(c.weekDatesOf(weeks[0]).length,1);assert.equal(c.weekDatesOf(weeks.at(-1)).length,4);assert.deepEqual(Array.from(c.yearsInData()),[2026,2027]);
});
test('Adding the trial does not shift the 2027 rotation anchor',()=>{
 const c=calendarContext();assert.equal(c.rotationIndex(c.RAW.weeks.find(w=>w.id==='4-8 January')),0);assert.equal(c.rotationIndex(c.RAW.weeks.find(w=>w.id==='trial-2026-11-02')),-9);
});
test('Annual allowance copy is independent, repeatable, and preserves explicit zero allowances',()=>{
 const c=base(['allowanceOf','setAllowanceFor']);c.DEFAULT_ALLOWANCE=28;c.store.roster=['Alice','Bob','Carol'];c.store.allowances={Alice:30,Bob:0};c.seedTrialAllowances(c.store);
 assert.equal(c.allowanceOf('Alice',2026),30);assert.equal(c.allowanceOf('Bob',2026),0);assert.equal(c.allowanceOf('Carol',2026),28);
 c.setAllowanceFor('Alice',2027,35);assert.equal(c.allowanceOf('Alice',2026),30);c.setAllowanceFor('Alice',2026,29);assert.equal(c.allowanceOf('Alice',2027),35);c.seedTrialAllowances(c.store);assert.equal(c.allowanceOf('Alice',2026),29);
});
test('Annual allowances survive export/import validation',()=>{
 const c=base(['prepareImport']);const x=c.prepareImport({schema:10,overrides:{},roster:['Alice'],allowances:{Alice:30,__years:{2026:{Alice:25}}}});assert.equal(x.allowances.__years[2026].Alice,25);assert.equal(x.allowances.Alice,30);assert.throws(()=>c.prepareImport({overrides:{},allowances:{__years:{2026:{Alice:'bad'}}}}));
});
test('Summary year selection separates years and excludes the separate 2026 Christmas period',()=>{
 const c=base(['summaryYear','filterSummaryYear','summaryMonths']);c.yearsInData=()=>[2026,2027];c.state.reportYear=2026;
 const map={'2026-9-31':{},'2026-10-1':{},'2026-11-24':{},'2026-11-25':{},'2027-0-4':{}};
 assert.deepEqual(Object.keys(c.filterSummaryYear(map)),['2026-10-1','2026-11-24']);assert.deepEqual(Array.from(c.summaryMonths(2026)),[10,11]);c.state.reportYear=2027;assert.deepEqual(Object.keys(c.filterSummaryYear(map)),['2027-0-4']);
});
test('2026 usage reports only trial-period Away entries',()=>{
 const c=base(['takenByPerson']);c.holidayEntries=()=>[new Date(2026,9,31),new Date(2026,10,1),new Date(2026,11,24),new Date(2026,11,25),new Date(2027,0,4)].map(date=>({date,name:'Alice'}));assert.equal(c.takenByPerson(2026).alice,2);assert.equal(c.takenByPerson(2027).alice,1);
});
test('Future dated templates do not silently apply to the 2026 trial',()=>{
 const c=base(['tplFromDate','tplFrom','templatesSorted','templateEntryFor']);c.store.templates=[{id:'future',from:'2027-01-04'}];assert.equal(c.templateEntryFor(new Date(2026,10,2)),null);c.store.templates.push({id:'baseline',from:null});assert.equal(c.templateEntryFor(new Date(2026,10,2)).id,'baseline');assert.equal(c.templateEntryFor(new Date(2027,0,4)).id,'future');
});
test('The 2026 allowance table omits a full-year Left column and remaining-balance cards',()=>{
 const c=base(['renderAdmin','card','allowanceOf','trialPeriodNote']);c.DEFAULT_ALLOWANCE=28;c.state.adminSort={key:'name',dir:'asc'};c.state.adminYear=2026;c.state.editing=false;c.yearsInData=()=>[2026,2027];c.takenByPerson=()=>({alice:2});c.esc=x=>String(x);c.fmtNum=String;c.isPublic=()=>false;c.updateAdminSummary=()=>{};c.store.roster=['Alice'];c.store.allowances={Alice:30,__years:{2026:{Alice:29}}};c.renderAdmin();let html=c.$('#adminView').innerHTML;assert(html.includes('Recorded'));assert(!/trial/i.test(html));assert(!html.includes('id="sumLeft"'));assert(!html.includes('data-sort="left"'));assert(html.includes('29</td>'));
 c.state.adminYear=2027;c.renderAdmin();html=c.$('#adminView').innerHTML;assert(html.includes('id="sumLeft"'));assert(html.includes('data-sort="left"'));assert(html.includes('30</td>'));
});

function planner(){
 const c=base(['autofillPlan','autofillBaseForWeek','autofillStructureSignature','fixedReservations','fixedRuleError','walkRoles','roleKey','roleLabel','rotationAssign','rotationFor','coverCommitted','chainAfter','generationSignature','buildGenerationReport','planDayName','prepareImport']);
 c.DAYFULL=['Monday','Tuesday','Wednesday','Thursday','Friday'];c.DAYLBL=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];c.fmtDate=dt=>dt.toISOString().slice(0,10);
 c.store.roster=['Alice','Bob','Carol','Dana','Erin'];c.allStaff=()=>c.store.roster;c.findPerson=n=>c.store.roster.find(x=>x.toLowerCase()===String(n).toLowerCase());c.isKnownPerson=n=>!!c.findPerson(n);c.roleLabelFor=k=>k;
 c.ckey=(si,ri,di)=>'a|'+si+'|'+ri+'|'+di;c.colDates=()=>[4,5,6,7,8].map(d=>new Date(2027,0,d));c.weekMonday=()=>new Date(2027,0,4);c.rotationIndex=()=>0;c.mappedWeekMarkerKeys=()=>new Set();c.preserveVoidAssignments=()=>{};
 const row=(slot,who)=>({type:'role',area:'',slot,assign:Array(5).fill(who)});
 c.tpl={sections:[{title:'News',rows:[row('First','Bob'),row('Second','Alice'),row('Third','Carol')]},{title:'Away',holiday:true,rows:[row('Away','')]}],cols:[4,5,6,7,8].map(d=>({y:2027,m:0,d})),notes:[]};
 c.templateEntryFor=()=>({data:c.tpl,label:'Baseline'});c.store.overrides.a=clone(c.tpl);c.store.fixedRules=[{role:'news||first',day:1,person:'Alice'}];return c;
}
function assignedPlan(c){const p=c.autofillPlan(),d=clone(p.base);for(const x of [...p.fills,...p.covers])d.sections[x.si].rows[x.ri].assign[x.di]=x.name;for(const x of p.gaps)d.sections[x.si].rows[x.ri].assign[x.di]='';return {p,d};}
test('Fixed rules reserve a weekday and cover the displaced assignment without duplicating the person',()=>{
 const c=planner();c.store.rules=[['Alice','Dana']];const {p,d}=assignedPlan(c);assert.equal(p.errors.length,0);assert.equal(d.sections[0].rows[0].assign[0],'Alice');assert.equal(d.sections[0].rows[1].assign[0],'Dana');assert.equal(d.sections[0].rows[0].assign[1],'Bob');assert.equal(d.sections[0].rows[1].assign[1],'Alice');assert(p.covers.some(x=>x.because==='fixed'));
});
test('Holiday is the exception to a fixed assignment and invokes the named cover',()=>{
 const c=planner();c.store.overrides.a.sections[1].rows[0].assign[0]='Alice';c.tpl.sections[0].rows[1].assign=Array(5).fill('');c.store.rules=[['Alice','Dana']];const {p,d}=assignedPlan(c);assert.equal(d.sections[0].rows[0].assign[0],'Dana');assert(p.fixed[0].away);assert.equal(d.sections[1].rows[0].assign[0],'Alice');
});
test('Cover cannot steal a fixed person, and tries the next available known cover',()=>{
 const c=planner();c.tpl.sections[0].rows[1].assign=Array(5).fill('Bob');c.store.overrides.a.sections[1].rows[0].assign[0]='Bob';c.store.rules=[['Bob','Alice','Not Personnel','Dana']];const {d}=assignedPlan(c);assert.equal(d.sections[0].rows[0].assign[0],'Alice');assert.equal(d.sections[0].rows[1].assign[0],'Dana');
});
test('Rotation and its priority sweep cannot move a fixed person or fill them twice',()=>{
 const c=planner();c.store.rotations=[{roles:['news||first','news||second','news||third'],names:['Bob','Alice','Carol']}];const {d}=assignedPlan(c);assert.equal(d.sections[0].rows[0].assign[0],'Alice');assert.equal(d.sections[0].rows.filter(r=>r.assign[0]==='Alice').length,1);assert.equal(d.sections[0].rows[0].assign[1],'Bob');
});
test('Fixed rules override not-needed markers and reject ambiguous/missing roles and double bookings',()=>{
 const c=planner();c.mappedWeekMarkerKeys=()=>new Set(['a|0|0|0']);assert.equal(assignedPlan(c).d.sections[0].rows[0].assign[0],'Alice');
 for(const rule of [{role:'missing',day:2,person:'Bob'},{role:'news||first',day:1,person:'Bob'},{role:'news||second',day:1,person:'Alice'}]){c.store.fixedRules.push(rule);assert(c.autofillPlan().errors.length);c.store.fixedRules.pop();}
 c.tpl.sections[0].rows.push(clone(c.tpl.sections[0].rows[0]));assert(c.autofillPlan().errors.some(x=>x.includes('more than one')));
});
test('A fixed-rule conflict cannot be applied even with a current preview version',()=>{
 const c=base(['applyAutofill']);c.AUTOPLAN={version:c.autofillVersion(),errors:['conflict'],base:{sections:[]}};c.applyAutofill();assert.equal(c.store.overrides.a.value,'old');assert(!c.SYNC.dirty);
});
test('Fixed rules preserve weekday identity across partial weeks, skip bank holidays, and invalidate previews',()=>{
 const c=planner();c.colDates=()=>[new Date(2026,11,21),new Date(2026,11,22),new Date(2026,11,23),new Date(2026,11,24)];c.store.overrides.a.cols=c.store.overrides.a.cols.slice(0,4);assert.equal(c.autofillPlan().fixed.length,1);c.isBankHol=()=>true;assert.equal(c.autofillPlan().fixed.length,0);const old=c.autofillVersion();c.store.fixedRules[0].person='Bob';assert.notEqual(old,c.autofillVersion());
});
test('Generation report splits holiday, unassigned staff and freelancers by affected days',()=>{
 const c=planner();c.store.freelance={Erin:true};c.store.overrides.a.sections[1].rows[0].assign[1]='Dana';c.store.rules=[['Alice','Dana']];const {p,d}=assignedPlan(c);const r=c.buildGenerationReport(d,p);
 assert.equal(r.groups.holiday.find(x=>x.name==='Dana').days.length,1);assert.equal(r.groups.staff.find(x=>x.name==='Dana').days.length,3);assert.equal(r.groups.freelance[0].name,'Erin');assert.equal(r.groups.freelance[0].days.length,5);assert.equal(r.groups.staff.find(x=>x.name==='Bob').days.length,1);assert(r.moves.some(x=>x.to==='Alice'&&x.why.includes('Fixed')));assert(r.moves.some(x=>x.to==='Dana'&&x.why.includes('fixed position')));assert.equal(r.signature,c.generationSignature(d));d.sections[0].rows[0].assign[0]='Bob';assert.notEqual(r.signature,c.generationSignature(d));
});
test('Fixed rules and generation reports round-trip in backups; malformed records are rejected',()=>{
 const c=planner();const {p,d}=assignedPlan(c);d.generationReport=c.buildGenerationReport(d,p);const backup={overrides:{a:d},roster:c.store.roster,fixedRules:c.store.fixedRules};const out=c.prepareImport(backup);assert.equal(out.fixedRules[0].person,'Alice');assert.equal(out.overrides.a.generationReport.version,1);
 for(const invalid of [{role:'r',day:0,person:'Alice'},{role:5,day:1,person:'Alice'},{role:'r',day:1,person:''}])assert.throws(()=>c.prepareImport({...backup,fixedRules:[invalid]}));const bad=clone(backup);bad.overrides.a.generationReport.groups.staff=42;assert.throws(()=>c.prepareImport(bad));
});

function mobileContext(){
 const c=base(['mobileDayData','mobileDateValue','localISO','weekDatesOf','colDates','parseWeDate','specialDates','walkRoles','roleKey','roleLabel','loadAccessToken','useMobileDay','moveMobileDay','selectMobilePerson']);
 c.AUTHKEY='token';c.MOBILE={date:'2026-11-02',followToday:false,person:'',fullWeek:false};c.window={matchMedia:()=>({matches:true})};c.allStaff=()=>['Alice','Bob'];c.store.cellVoid={};c.store.cellNotes={};c.store.cellCover={};
 c.RAW.weeks=[{id:'a',kind:'weekday',name:'2-3 November 2026'},{id:'w',kind:'weekend',name:'7-8 November 2026'},{id:'s',kind:'weekend',name:'1 November 2026'}];
 c.store.overrides={a:{cols:[{y:2026,m:10,d:2},{y:2026,m:10,d:3}],sections:[{title:'News',rows:[{type:'role',slot:'Editor',assign:['Alice','Bob']},{type:'role',area:'London',slot:'AM',assign:['Bob','Alice']},{type:'role',slot:'PM',assign:['Alice','']}]},{title:'Away',holiday:true,rows:[{type:'role',assign:['Bob','']}]}],notes:['Weekly note']},w:{y:2026,satHeader:'7 November',sunHeader:'8 November',rows:[{role:'Duty',sat:'Alice',sun:'Bob'}],awayRows:[{sat:'Bob',sun:''}]},s:{y:2026,special:true,cols:[{key:'sun',sub:'1 Nov'}],rows:[{role:'Sunday role',vals:{sun:'Bob'}}],awayRows:[{vals:{sun:'Alice'}}]}};
 c.canViewWeek=w=>c.store.public[w.id]!==false;c.publicTotals=()=>({});return c;
}
test('Mobile daily view shows only the selected weekday and preserves role, cover and note details',()=>{
 const c=mobileContext();c.store.cellNotes['a|0|0|0']='Starts 06:00';c.store.cellCover['a|0|0|0']=true;const day=c.mobileDayData('2026-11-02');assert.equal(day.sections.length,1);assert.equal(day.sections[0].rows.length,3);assert.equal(day.sections[0].rows[2].label,'London (PM)');assert.equal(day.sections[0].rows[0].note,'Starts 06:00');assert(day.sections[0].rows[0].cover);assert.equal(day.away[0],'Bob');assert.equal(c.mobileDayData('2026-11-03').sections[0].rows[0].name,'Bob');
});
test('Mobile personal filtering includes only the selected person and excludes void roles',()=>{
 const c=mobileContext();c.store.cellVoid['a|0|2|0']=true;const day=c.mobileDayData('2026-11-02','alice');assert.equal(day.sections[0].rows.length,1);assert.equal(day.sections[0].rows[0].name,'Alice');assert.equal(day.away.length,0);assert.equal(day.gaps.length,0);assert.equal(day.notes.length,0);
});
test('Mobile hidden weeks never disclose assignments or notes while requested public absence names remain visible',()=>{
 const c=mobileContext();c.store.public.a=false;c.publicTotals=()=>({'2026-10-2':{names:['Bob']}});const d=c.mobileDayData('2026-11-02');assert.equal(d.hidden.length,1);assert.equal(d.sections.length,0);assert.equal(d.notes.length,0);assert.equal(d.gaps.length,0);assert.equal(d.away[0],'Bob');assert(!JSON.stringify(d).includes('Alice'));
});
test('Mobile weekends and Sunday-only special pages use the correct date and assignment key',()=>{
 const c=mobileContext();assert.equal(c.mobileDayData('2026-11-07').sections[0].rows[0].name,'Alice');assert.equal(c.mobileDayData('2026-11-08').sections[0].rows[0].name,'Bob');assert.equal(c.mobileDayData('2026-11-01').sections[0].rows[0].label,'Sunday role');assert.equal(c.mobileDayData('2026-11-01','Alice').away[0],'Alice');assert.equal(c.mobileDayData('2026-11-09').weeks.length,0);
});
test('Mobile daily mode honours bank holidays, blocked pages, deleted weeks and excluded Christmas dates',()=>{
 const c=mobileContext();c.isBankHol=d=>d?.getDate()===2;assert.equal(c.mobileDayData('2026-11-02').sections.length,0);assert.equal(c.mobileDayData('2026-11-02').away[0],'Bob');c.store.overrides.w.blocked='Separate rota';assert.equal(c.mobileDayData('2026-11-07').sections.length,0);assert.equal(c.mobileDayData('2026-11-07').blocked.length,1);c.store.deletedWeeks=['s'];assert.equal(c.mobileDayData('2026-11-01').weeks.length,0);assert.equal(c.mobileDayData('2026-12-25').weeks.length,0);
});
test('Daily mode is read-only, phone-sized and separate from summary and template views',()=>{
 const c=mobileContext();c.state.editing=false;assert(c.useMobileDay());c.state.editing=true;assert(!c.useMobileDay());c.state.editing=false;c.state.templateMode=true;assert(!c.useMobileDay());c.state.templateMode=false;c.state.view='heat';assert(!c.useMobileDay());c.state.view='rota';c.MOBILE.fullWeek=true;assert(!c.useMobileDay());c.MOBILE.fullWeek=false;c.window.matchMedia=()=>({matches:false});assert(!c.useMobileDay());
});
test('Daily date navigation validates dates and crosses month/year/DST boundaries in local calendar days',()=>{
 const c=mobileContext();assert.equal(c.mobileDateValue('2026-02-30'),null);assert.equal(c.mobileDateValue('bad'),null);c.chooseMobileDate=v=>{c.MOBILE.date=v;};for(const [date,step,want] of [['2026-12-31',1,'2027-01-01'],['2026-11-01',-1,'2026-10-31'],['2027-03-28',1,'2027-03-29']]){c.MOBILE.date=date;c.moveMobileDay(step);assert.equal(c.MOBILE.date,want);}
});
test('Choosing a personal rota remembers a device-only name without changing access or shared data',()=>{
 const c=mobileContext(),snapshot=JSON.stringify(c.syncSnapshot());c.selectMobilePerson('alice');assert.equal(c.MOBILE.person,'Alice');assert.equal(c.storage.news_rota_my_person,'Alice');assert.equal(c.state.role,'ops');assert.equal(JSON.stringify(c.syncSnapshot()),snapshot);c.selectMobilePerson('Unknown');assert.equal(c.MOBILE.person,'');
});
test('Every fresh load discards remembered elevated tokens and requires an explicit profile selection',()=>{
 const c=mobileContext();let removed=false;c.sessionStorage={getItem(){return 'previous-ops-token';},removeItem(k){removed=k==='token';}};assert.equal(c.loadAccessToken(),'');assert(removed);assert(!source.includes('if(!state.role) openRoleGate();'));
});
test('Mobile daily search finds roles, sections and people without mixing dates or mutating the source',()=>{
 const c=mobileContext();vm.runInContext(extract('filterMobileDay'),c);const day=c.mobileDayData('2026-11-02'),before=JSON.stringify(day);
 assert.equal(c.filterMobileDay(day,'editor').sections[0].rows[0].name,'Alice');assert.equal(c.filterMobileDay(day,'LONDON').sections[0].rows.length,2);assert.equal(c.filterMobileDay(day,'Bob').sections[0].rows.length,1);assert.equal(c.filterMobileDay(day,'Bob').away[0],'Bob');assert.equal(c.filterMobileDay(day,'missing').sections.length,0);assert.equal(JSON.stringify(day),before);assert.equal(c.filterMobileDay(c.mobileDayData('2026-11-03'),'editor').sections[0].rows[0].name,'Bob');
});
test('Daily search cannot reveal hidden-week roles and can find unfilled roles',()=>{
 const c=mobileContext();vm.runInContext(extract('filterMobileDay'),c);c.store.public.a=false;assert.equal(c.filterMobileDay(c.mobileDayData('2026-11-02'),'Editor').sections.length,0);c.store.public.a=true;const result=c.filterMobileDay(c.mobileDayData('2026-11-03'),'PM');assert.equal(result.gaps.length,1);assert.equal(result.gaps[0].label,'London (PM)');
});
test('Printing the mobile rota labels the selected day and search rather than a stale week',()=>{
 const c=mobileContext();vm.runInContext(extract('preparePrint'),c);c.useMobileDay=()=>true;c.MONTHF=['January','February','March','April','May','June','July','August','September','October','November','December'];c.MOBILE.query='editor';c.preparePrint();assert(c.$('#phTitle').textContent.includes('2 November 2026'));assert.equal(c.$('#phSub').textContent,'Daily search: editor');c.MOBILE.query='';c.MOBILE.person='Alice';c.preparePrint();assert.equal(c.$('#phSub').textContent,'Personal rota — Alice');
});
test('Personal Upcoming includes the current Monday week and leaves All dates intact',()=>{
 const c=base(['mondayOf','personalRangeItems']);const rows=[{date:new Date(2026,8,20),kind:'work'},{date:new Date(2026,8,21),kind:'holiday'},{date:new Date(2026,8,27),kind:'conflict'},{date:new Date(2027,0,1),kind:'work'}];
 assert.equal(c.personalRangeItems(rows,'upcoming',new Date(2026,8,23)).length,3);assert.equal(c.personalRangeItems(rows,'all',new Date(2026,8,23)),rows);assert.equal(rows.length,4);
});
test('Phone week strip covers Monday to Sunday across year and daylight-saving boundaries',()=>{
 const c=base(['mondayOf','mobileDateValue','localISO','weekStripDates']);
 assert.deepEqual(Array.from(c.weekStripDates('2027-01-01'),d=>c.localISO(d)),['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']);
 const days=c.weekStripDates('2027-03-28');assert.equal(days[0].getDay(),1);assert.equal(days[6].getDay(),0);assert.equal(c.localISO(days[6]),'2027-03-28');
});
test('Phone summaries constrain selected month to the year and retain the full overview',()=>{
 const c=base(['summaryMonths','selectedSummaryMonth','visibleSummaryMonths']);c.isPhone=()=>true;c.UI22.summaryMonth[2026]=0;
 assert.equal(c.selectedSummaryMonth(2026),10);assert.equal(c.visibleSummaryMonths(2026).length,1);c.UI22.summaryMonth[2026]=11;assert.equal(c.visibleSummaryMonths(2026)[0],11);
 c.UI22.yearOverview=true;assert.deepEqual(Array.from(c.visibleSummaryMonths(2026)),[10,11]);c.UI22.yearOverview=false;c.isPhone=()=>false;assert.equal(c.visibleSummaryMonths(2027).length,12);
});
test('Readable phone role labels retain shift and station acronyms',()=>{
 const c=base(['titleCase','readableRole']);assert.equal(c.readableRole('CREATION (PM)'),'Creation (PM)');assert.equal(c.readableRole('UK 120 (AM)'),'UK 120 (AM)');assert.equal(c.readableRole('KISS'),'KISS');assert.equal(c.readableRole('McDonald desk'),'McDonald desk');
});
test('Daily print label follows Everyone even when a personal name remains remembered',()=>{
 const c=mobileContext();vm.runInContext(extract('preparePrint'),c);c.useMobileDay=()=>true;c.MOBILE.person='Alice';c.MOBILE.audience='everyone';c.MOBILE.query='';c.MONTHF=Array(12).fill('Month');c.preparePrint();assert.equal(c.$('#phSub').textContent,'Daily rota');
});
function phoneGuardContext(){
 const c=base(['enforcePhoneStaff']),classes=new Set();c.isPhone=()=>true;c.phoneAccessBusy=false;c.frames=[];c.requestAnimationFrame=fn=>c.frames.push(fn);c.document.body={classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}};c.switchToStaff=()=>{c.switched=true;c.state.role='staff';c.SYNC.serverRole='staff';c.SYNC.canEdit=false};c.closeRoleGate=()=>{};return c;
}
test('Phone layout downgrades a clean elevated session and never changes rota data',()=>{
 const c=phoneGuardContext(),before=JSON.stringify(c.store);assert.equal(c.enforcePhoneStaff(),false);assert.equal(c.switched,true);assert.equal(c.state.role,'staff');assert.equal(JSON.stringify(c.store),before);assert.equal(c.frames.length,1);
});
test('Phone layout preserves pending Operations edits and session until desktop or save completion',()=>{
 const c=phoneGuardContext();c.store.overrides.a.value='unsaved';const before=JSON.stringify(c.store);c.SYNC.dirty=true;assert.equal(c.enforcePhoneStaff(),false);assert(!c.switched);assert.equal(c.SYNC.authToken,'test-token');assert.equal(JSON.stringify(c.store),before);assert.equal(c.$('#phoneAccessPending').hidden,false);
 c.isPhone=()=>false;assert.equal(c.enforcePhoneStaff(),true);assert.equal(c.$('#phoneAccessPending').hidden,true);assert.equal(c.state.role,'ops');
});
test('Phone layout blocks an in-flight save or access refresh from being discarded',()=>{
 for(const field of ['saving','refreshing','conflict']){const c=phoneGuardContext();c.SYNC[field]=true;c.enforcePhoneStaff();assert(!c.switched,field);assert.equal(c.state.role,'ops');}
});
test('Phone layout refuses editing and opening the elevated-profile chooser',()=>{
 const c=base(['setEditing','openRoleGate']);c.isPhone=()=>true;c.state.editing=false;c.setEditing(true);assert.equal(c.state.editing,false);c.openRoleGate('ops');assert.equal(c.state.role,'ops');assert.equal(c.$('#roleGate').className,'');
});
function personalTimelineContext(){
 const c=mobileContext();c.MON3=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 vm.runInContext(['mondayOf','personalRangeItems','personSchedule','personalScheduleWeeks','personalDateRanges','fmtDate'].map(extract).join('\n'),c);return c;
}
test('Personal timeline retains hidden weeks without reading restricted assignments',()=>{
 const c=personalTimelineContext();for(const w of c.RAW.weeks)c.store.public[w.id]=false;
 Object.defineProperty(c.store.overrides.a,'sections',{get(){throw Error('Read hidden assignments');}});
 const weeks=c.personalScheduleWeeks('Alice','all',new Date(2026,8,24));assert.equal(weeks.length,2);assert.equal(weeks[0].hiddenDates.length,1);assert.equal(weeks[1].hiddenDates.length,4);assert(weeks.every(w=>w.items.length===0&&w.visibleDates.length===0));
});
test('Personal timeline preserves published empty weeks and distinguishes partially unpublished weekends',()=>{
 const c=personalTimelineContext();c.store.public.w=false;
 const empty=c.personalScheduleWeeks('Nobody','all',new Date(2026,8,24));assert.equal(empty.length,2);assert.equal(empty[1].items.length,2);assert(empty[1].items.every(i=>i.kind==='na'));assert.equal(empty[1].visibleDates.length,2);assert.equal(empty[1].hiddenDates.length,2);
 const alice=c.personalScheduleWeeks('Alice','all',new Date(2026,8,24));assert.equal(alice[1].items.length,2);assert.equal(alice[1].hiddenDates.length,2);assert(!JSON.stringify(alice[1].items).includes('Duty'));
});
test('Personal timeline uses profile visibility and updates when the weekend is published',()=>{
 const c=personalTimelineContext();c.store.public.w=false;const now=new Date(2026,8,24);
 assert.equal(c.personalScheduleWeeks('Alice','all',now)[1].hiddenDates.length,2);c.store.public.w=true;
 assert.equal(c.personalScheduleWeeks('Alice','all',now)[1].items.length,4);assert.equal(c.personalScheduleWeeks('Alice','all',now)[1].hiddenDates.length,0);
 c.store.public.w=false;c.canViewWeek=()=>true;assert.equal(c.personalScheduleWeeks('Alice','all',now)[1].hiddenDates.length,0);assert.equal(c.personalScheduleWeeks('Alice','all',now)[1].items.length,4);
});
test('Personal timeline excludes deleted pages and keeps separate-rota dates without their assignments',()=>{
 const c=personalTimelineContext();c.store.deletedWeeks=['s'];c.store.overrides.w.blocked='Separate rota';
 const weeks=c.personalScheduleWeeks('Alice','all',new Date(2026,8,24));assert.equal(weeks.length,1);assert.equal(weeks[0].blockedDates.length,2);assert.equal(weeks[0].items.length,2);assert(!JSON.stringify(weeks).includes('Duty'));
});
test('Personal timeline sorts year boundaries, filters Upcoming and does not invent excluded dates',()=>{
 const c=personalTimelineContext();c.RAW.weeks.push({id:'newyear',kind:'weekday'});c.store.overrides.newyear={cols:[{y:2027,m:0,d:1}],sections:[]};c.RAW.weeks.reverse();
 const all=c.personalScheduleWeeks('Nobody','all',new Date(2026,10,4));assert.deepEqual(Array.from(all,w=>c.localISO(w.monday)),['2026-10-26','2026-11-02','2026-12-28']);
 const upcoming=c.personalScheduleWeeks('Nobody','upcoming',new Date(2026,10,4));assert.equal(upcoming.length,2);assert.equal(upcoming[1].visibleDates.length,1);assert.equal(c.localISO(upcoming[1].visibleDates[0]),'2027-01-01');
});
test('Personal unpublished date labels group consecutive days without implying missing dates are covered',()=>{
 const c=personalTimelineContext();assert.equal(c.personalDateRanges([new Date(2026,10,2),new Date(2026,10,3),new Date(2026,10,7),new Date(2026,10,8)]),'2 Nov – 3 Nov, 7 Nov – 8 Nov');
 assert.equal(c.personalDateRanges([new Date(2027,2,27),new Date(2027,2,28),new Date(2027,2,29)]),'27 Mar – 29 Mar');
});

test('Personal rota keeps an unassigned Wednesday between Tuesday and Thursday, plus empty weekend days',()=>{
 const c=personalTimelineContext();c.store.overrides.a={cols:[2,3,4,5,6].map(d=>({y:2026,m:10,d})),sections:[{title:'News',rows:[{type:'role',slot:'Editor',assign:['Alice','Alice','','Alice','Alice']}]}]};
 c.store.overrides.w.rows=[];c.store.overrides.w.awayRows=[];
 const week=c.personalScheduleWeeks('Alice','all',new Date(2026,8,24))[1];
 assert.deepEqual(Array.from(week.items,i=>c.localISO(i.date)),['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08']);
 assert.deepEqual(Array.from(week.items,i=>i.kind),['work','work','na','work','work','na','na']);
 assert.equal(week.items.filter(i=>i.kind==='work'||i.kind==='conflict').length,4);
});
test('Personal rota renders an accessible blank role for empty days without counting them as work',()=>{
 const c=personalTimelineContext();vm.runInContext(extract('openPersonModal'),c);
 c.$('#personEditBtn').dataset={};c.document.querySelectorAll=()=>[];c.$('#personModal').classList.contains=()=>false;c.personRecord=()=>null;c.isPhone=()=>false;c.esc=s=>s;c.DAYLBL=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 c.personalScheduleWeeks=()=>[{monday:new Date(2026,10,2),items:[{date:new Date(2026,10,4),kind:'na'}],hiddenDates:[],blockedDates:[],visibleDates:[new Date(2026,10,4)]}];
 c.openPersonModal('Alice');assert(c.$('#personBody').innerHTML.includes('<b>Wed</b> 4 Nov'));assert(c.$('#personBody').innerHTML.includes('aria-label="No assignment">—'));assert.equal(c.$('#personSub').textContent,'0 on shift  ·  0 on holiday');
});
