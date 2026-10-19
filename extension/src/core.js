export const uid = () => crypto.randomUUID();
export const legalVersion = '2026-10-18.1';
export const dayKey = (date = new Date()) => {const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const themes = [
 {id:'sage',name:'Quiet campus',bg:'#f4f6f1',surface:'#ffffff',text:'#253831',accent:'#4c7663',palette:['#86a98d','#d6bc86','#a0b5d3','#bd9dba'],font:'system-ui',dark:false},
 {id:'night',name:'Midnight library',bg:'#101922',surface:'#192630',text:'#dce9f0',accent:'#83cabb',palette:['#57867f','#687a9c','#ad8e68','#926f96'],font:'system-ui',dark:true},
 {id:'rose',name:'Rose garden',bg:'#fff4f5',surface:'#ffffff',text:'#51383f',accent:'#a65773',palette:['#db9caf','#d7b38a','#b09ace','#98bcad'],font:'Georgia',dark:false},
 {id:'ocean',name:'Ocean blue',bg:'#edf5fa',surface:'#ffffff',text:'#233d52',accent:'#397d9e',palette:['#70a6bb','#8cbfae','#caa585','#9c9cc9'],font:'system-ui',dark:false},
 {id:'ember',name:'Evening ember',bg:'#211c1a',surface:'#312925',text:'#f6e7d9',accent:'#e2a376',palette:['#ae7665','#b3986b','#768b72','#8b829a'],font:'Georgia',dark:true}
];
export const initial = () => ({schema:1,legalAcceptance:null,tasks:[],courses:[],notes:[],sets:[],themes:[],themeHistory:[],activity:[],scores:{},settings:{theme:themes[0],mode:'light',darkStart:'19:00',darkEnd:'07:00',rotate:false,compact:false,gradient:true,hideLogo:false,hideFeedback:false,showGrades:true,cardLinks:true,font:'system-ui',reminders:false,reminderMinutes:60,focusMinutes:25,breakMinutes:5,breathSeconds:60,quote:'Small steps are still progress.',playlist:'',model:'qwen3:4b',lmsOrigins:[],cardOverrides:{},gpaScale:'whole',gpaTermKey:'auto',priorGpa:0,priorCredits:0,gpaHistory:[]}});
export function mergeImport(state, incoming) {
 if (!incoming || incoming.schema!==1) throw Error('Unsupported backup format.');
 for (const key of ['tasks','courses','notes','sets','themes','themeHistory','activity']) if(!Array.isArray(incoming[key])) throw Error(`Invalid ${key}.`);
 if(!incoming.settings || typeof incoming.settings!=='object')throw Error('Invalid settings.');
 const clean=structuredClone(incoming), string=(v,name)=>{if(typeof v!=='string')throw Error(`Invalid ${name}.`);return v;}, number=(v,name,nullable=false)=>{if(nullable&&(v===null||v===undefined||v===''))return;if(typeof v!=='number'||!Number.isFinite(v))throw Error(`Invalid ${name}.`);}, item=(v,name)=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error(`Invalid ${name}.`);string(v.id,name+' ID');};
 for(const t of clean.tasks){item(t,'task');string(t.title,'task title');if(t.subtasks&&!Array.isArray(t.subtasks))throw Error('Invalid subtasks.');for(const sub of t.subtasks||[])string(sub.title,'subtask title');for(const key of ['due','workStart','workEnd'])if(t[key]&&!Number.isFinite(Date.parse(t[key])))throw Error(`Invalid ${key}.`);for(const key of ['minutes','score','points'])number(t[key],key,true);}
 for(const c of clean.courses){item(c,'course');string(c.name,'course name');number(c.credits,'credits');number(c.goal,'goal');number(c.grade,'grade',true);if(c.history&&!Array.isArray(c.history))throw Error('Invalid grade history.');for(const h of c.history||[])number(h.grade,'historical grade');}
 for(const n of clean.notes){item(n,'note');string(n.title,'note title');string(n.body,'note body');if(!Array.isArray(n.files))throw Error('Invalid note files.');for(const f of n.files||[]){item(f,'file');string(f.name,'file name');}}
 for(const set of clean.sets){item(set,'study set');string(set.title,'set title');if(!Array.isArray(set.cards))throw Error('Invalid cards.');for(const card of set.cards){item(card,'card');string(card.front,'card front');string(card.back,'card back');}}
 for(const t of [clean.settings.theme,...clean.themes,...clean.themeHistory]){item(t,'theme');string(t.name,'theme name');for(const key of ['bg','surface','text','accent'])if(!/^#[\da-f]{6}$/i.test(t[key]))throw Error('Invalid theme color.');if(!Array.isArray(t.palette)||t.palette.some(c=>!/^#[\da-f]{6}$/i.test(c)))throw Error('Invalid theme palette.');}
 for(const activity of clean.activity){item(activity,'activity');string(activity.day,'activity day');number(activity.xp,'activity XP');}
 clean.settings={...initial().settings,...state.settings,...clean.settings,lmsOrigins:state.settings.lmsOrigins};
 clean.legalAcceptance=state.legalAcceptance||null;
 if(!['light','dark','system','schedule'].includes(clean.settings.mode))throw Error('Invalid display mode.');
 for(const time of [clean.settings.darkStart,clean.settings.darkEnd])if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Invalid dark mode schedule.');
 for(const key of ['focusMinutes','breakMinutes','breathSeconds','reminderMinutes'])if(Number(clean.settings[key])<=0||!Number.isFinite(Number(clean.settings[key])))throw Error(`Invalid ${key}.`);
 if(!['whole','plusMinus'].includes(clean.settings.gpaScale))throw Error('Invalid GPA scale.');
 if(typeof clean.settings.gpaTermKey!=='string')throw Error('Invalid GPA term selection.');
 for(const key of ['priorCredits','priorGpa']){number(clean.settings[key],key);if(clean.settings[key]<0||(key==='priorGpa'&&clean.settings[key]>5))throw Error(`Invalid ${key}.`);}
 if(!Array.isArray(clean.settings.gpaHistory))throw Error('Invalid GPA history.');
 for(const h of clean.settings.gpaHistory){item(h,'GPA history');number(h.credits,'historical credits');if(h.credits<=0)throw Error('Historical credits must be positive.');number(h.grade,'historical score',true);number(h.gpa,'historical GPA',true);if(h.gpa!=null&&(h.gpa<0||h.gpa>5))throw Error('Invalid historical GPA.');if(h.grade==null&&h.gpa==null&&!Object.hasOwn(letterPoints,letterValue(h.letter)))throw Error('A historical grade or GPA is required.');}
 for(const c of clean.courses){number(c.currentGrade,'current grade',true);number(c.finalGrade,'final grade',true);number(c.manualGrade,'manual grade',true);if(c.gpaExclude!==undefined&&typeof c.gpaExclude!=='boolean')throw Error('Invalid course GPA exclusion.');}
 clean.scores=clean.scores&&typeof clean.scores==='object'?clean.scores:{};for(const value of Object.values(clean.scores))number(value,'game score');
 if(!clean.settings.cardOverrides||typeof clean.settings.cardOverrides!=='object')throw Error('Invalid card overrides.');for(const override of Object.values(clean.settings.cardOverrides)){if(!override||typeof override!=='object')throw Error('Invalid card override.');if(override.links&&!Array.isArray(override.links))throw Error('Invalid card links.');}
 return clean;
}
export function recordActivity(state,kind,reference,now=new Date()) {
 const id=`${kind}:${reference}`;if(state.activity.some(a=>a.id===id))return;
 state.activity.push({id,kind,day:dayKey(now),xp:kind==='focus'?30:kind==='study'?5:15});
}
export function streak(state,now=new Date()) {
 const days=new Set(state.activity.map(a=>a.day));let d=new Date(now),count=0;
 if(!days.has(dayKey(d)))d.setDate(d.getDate()-1);
 while(days.has(dayKey(d))){count++;d.setDate(d.getDate()-1);}return count;
}
// Legacy college scale remains plus/minus; dashboard GPA explicitly defaults to whole letters.
const gradeNumber = value => value === null || value === undefined || (typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && !value.trim()) || !Number.isFinite(Number(value)) ? null : Number(value);
const letterValue = value => typeof value === 'string' ? value.trim().toUpperCase().replace('−','-') : '';
const letterPoints = {'A+':4,A:4,'A-':3.7,'B+':3.3,B:3,'B-':2.7,'C+':2.3,C:2,'C-':1.7,'D+':1.3,D:1,'D-':0.7,F:0};
export function gradePoint(percent,scale='college',rigor=0) {
 const letter=letterValue(percent), p=gradeNumber(percent), whole=scale==='whole'||scale==='highschool';
 let point;
 if(Object.hasOwn(letterPoints,letter))point=whole?({A:4,B:3,C:2,D:1,F:0}[letter[0]]):letterPoints[letter];
 else if(p!==null&&p>=0)point=whole?(p>=90?4:p>=80?3:p>=70?2:p>=60?1:0):(p>=93?4:p>=90?3.7:p>=87?3.3:p>=83?3:p>=80?2.7:p>=77?2.3:p>=73?2:p>=70?1.7:p>=67?1.3:p>=63?1:p>=60?.7:0);
 else return null;
 const bonus=gradeNumber(rigor);return point+(point>0&&bonus!==null?Math.max(0,bonus):0);
}
export function gpa(courses,scale='college') {
 const eligible=courses.filter(c=>!c.gpaExclude&&gradePoint(c.grade,scale)!==null&&gradeNumber(c.credits)>0);
 const total=eligible.reduce((a,c)=>a+Number(c.credits),0);
 return total?eligible.reduce((a,c)=>a+gradePoint(c.grade,scale,scale==='highschool'?c.rigor:0)*Number(c.credits),0)/total:null;
}
const validDate = value => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
const termKeyOf = c => c.termKey || (c.termId!=null ? (c.sourceOrigin||'local')+'|term:'+c.termId : null);
export function isCurrentCourse(course,now=new Date()) {
 if(course.concluded||['completed','deleted'].includes(course.courseState)||['completed','inactive','deleted','rejected'].includes(course.enrollmentState))return false;
 const clock=new Date(now).getTime();
 const start=validDate(course.restrictCourseDates?course.courseStart||course.termStart:course.termStart||course.courseStart);
 const end=validDate(course.restrictCourseDates?course.courseEnd||course.termEnd:course.termEnd||course.courseEnd);
 return (start===null||start<=clock)&&(end===null||end>clock);
}
/** Credit-weighted estimates. Current grades exclude ungraded work; concluded courses prefer posted final grades.
 * Pass an array or full state. Settings aliases: gpaScale, gpaTermKey, priorCredits, priorGpa, gpaHistory.
 * Returned rows disclose their score basis and assumed credits; missing grades never become zero.
 */
export function gpaSummary(input,options={}) {
 const courses=Array.isArray(input)?input:(input?.courses||[]);
 const o={...(Array.isArray(input)?{}:input?.settings||{}),...options};
 const scale=(o.scale||o.gpaScale)==='plusMinus'||o.scale==='college'?'plusMinus':'whole';
 const now=new Date(o.now||Date.now()), defaultCredits=gradeNumber(o.defaultCredits)>0?Number(o.defaultCredits):3;
 const scoped=courses.filter(c=>(!o.origin||!c.sourceOrigin||c.sourceOrigin===o.origin)&&(!o.userId||!c.userId||String(c.userId)===String(o.userId))&&(!c.userId||!o.activeAccounts?.[c.sourceOrigin]||String(c.userId)===String(o.activeAccounts[c.sourceOrigin])));
 const unique=[...new Map(scoped.map((c,i)=>[c.id??'row:'+i,c])).values()];
 const termsMap=new Map();
 for(const c of unique){const key=termKeyOf(c);if(!key)continue;const current=termsMap.get(key)||{key,id:c.termId??null,name:c.termName||'Unnamed term',start:c.termStart||null,end:c.termEnd||null};termsMap.set(key,current);}
 const terms=[...termsMap.values()].sort((a,b)=>(validDate(b.start)||0)-(validDate(a.start)||0)||a.name.localeCompare(b.name));
 const request=o.termKey||o.gpaTermKey;
 let selectedTerm=request&&request!=='auto'?terms.find(t=>t.key===request)||null:o.termId!=null?terms.find(t=>String(t.id)===String(o.termId))||null:null;
 const explicit=!!((request&&request!=='auto')||o.termId!=null);
 let termReason=explicit?'selected':'active-enrollments';
 if(!explicit){
  const activeKeys=new Set(unique.filter(c=>isCurrentCourse(c,now)&&(gradeNumber(c.currentGrade??c.grade)!==null||Object.hasOwn(letterPoints,letterValue(c.currentLetter)))).map(termKeyOf).filter(Boolean));
  const dated=terms.filter(t=>activeKeys.has(t.key)&&validDate(t.start)!==null&&validDate(t.start)<=now.getTime()&&(validDate(t.end)===null||validDate(t.end)>now.getTime()));
  if(dated.length===1){selectedTerm=dated[0];termReason='dated-active-term';}
  else if(activeKeys.size===1){selectedTerm=terms.find(t=>activeKeys.has(t.key))||null;termReason='single-active-term';}
 }
 const current={gpa:null,credits:0,qualityPoints:0,count:0,rows:[],excluded:[]};
 const cumulative={gpa:null,credits:0,qualityPoints:0,count:0,rows:[],excluded:[]};
 function exclusion(bucket,c,reason){bucket.excluded.push({id:c.id??null,name:c.name||'',reason});}
 function addCourse(bucket,c,historical=false,manual=false) {
  if(c.gpaExclude===true||c.excludeGpa===true){exclusion(bucket,c,'excluded-by-user');return;}
  if(c.hideFinalGrades===true&&!manual){exclusion(bucket,c,'grades-hidden');return;}
  if(c.enrollmentType&&!['student','StudentEnrollment'].includes(c.enrollmentType)&&!manual){exclusion(bucket,c,'not-student-enrollment');return;}
  const credits=c.credits===undefined||c.credits===null?defaultCredits:gradeNumber(c.credits);
  if(credits===null||credits<=0){exclusion(bucket,c,'no-valid-credits');return;}
  const currentScore=Object.hasOwn(c,'currentGrade')?gradeNumber(c.currentGrade):gradeNumber(c.grade);
  const finalScore=gradeNumber(c.finalGrade);
  const override=gradeNumber(c.manualGrade);
  const historicalScore=historical&&finalScore!==null?finalScore:currentScore;
  const score=override!==null?override:historicalScore;
  const letter=letterValue(c.manualLetter||(override!==null?'':historical&&finalScore!==null?c.finalLetter||'':c.currentLetter));
  if(letter&&!Object.hasOwn(letterPoints,letter)){exclusion(bucket,c,'non-gpa-grade');return;}
  // A synthetic final zero without any current graded work is not an earned F.
  if(!manual&&override===null&&currentScore===null&&finalScore===0&&c.gpaInclude!==true){exclusion(bucket,c,'ungraded');return;}
  const direct=manual?gradeNumber(c.gpa):null;
  const points=direct!==null&&direct>=0&&direct<=5?direct:gradePoint(letter||score,scale,o.weighted?c.rigor:0);
  if(points===null){exclusion(bucket,c,'ungraded');return;}
  const assumedCredits=c.credits===undefined||c.credits===null||c.creditsAssumed===true;
  const basis=direct!==null?'manual-gpa':override!==null?'manual-score':historical&&finalScore!==null?'posted-final':letter?'posted-letter':'current-estimate';
  const row={id:c.id??null,name:c.name||'Historical coursework',credits,score,letter:letter||null,points,qualityPoints:points*credits,termKey:termKeyOf(c),basis,assumedCredits};
  bucket.rows.push(row);bucket.credits+=credits;bucket.qualityPoints+=row.qualityPoints;bucket.count++;
 }
 const history=Array.isArray(o.manualHistory)?o.manualHistory:Array.isArray(o.gpaHistory)?o.gpaHistory:[];
 const manual=[...new Map(history.filter(h=>h&&typeof h==='object'&&!Array.isArray(h)).map((h,i)=>[h.id??'manual:'+i,h])).values()];
 const replaced=new Set(manual.flatMap(h=>[h.courseId,...(Array.isArray(h.replacesCourseIds)?h.replacesCourseIds:[])].filter(Boolean)));
 for(const c of unique){
  const key=termKeyOf(c), active=isCurrentCourse(c,now);
  const inTerm=selectedTerm?(key===selectedTerm.key||(!explicit&&!key&&c.source!=='canvas'&&active)):!explicit&&active;
  const end=validDate(c.restrictCourseDates?c.courseEnd||c.termEnd:c.termEnd||c.courseEnd);
  const historical=c.concluded===true||c.courseState==='completed'||c.enrollmentState==='completed'||(end!==null&&end<=now.getTime());
  if(inTerm)addCourse(current,c,historical);
  else exclusion(current,c,explicit&&!selectedTerm?'unknown-selected-term':'outside-current-term');
  const start=validDate(c.termStart||c.courseStart);
  if(start!==null&&start>now.getTime()){exclusion(cumulative,c,'future-course');continue;}
  if(!replaced.has(c.id))addCourse(cumulative,c,historical);
 }
 for(const h of manual){
  if(o.origin&&h.sourceOrigin&&h.sourceOrigin!==o.origin)continue;
  if(o.userId&&h.userId&&String(h.userId)!==String(o.userId))continue;
  if(h.userId&&o.activeAccounts?.[h.sourceOrigin]&&String(h.userId)!==String(o.activeAccounts[h.sourceOrigin]))continue;
  addCourse(cumulative,{...h,currentGrade:h.grade??h.currentGrade,manualLetter:h.letter||h.manualLetter},true,true);
 }
 const priorCredits=gradeNumber(o.priorCredits), priorGpa=gradeNumber(o.priorGpa);
 if(priorCredits>0&&priorGpa!==null&&priorGpa>=0&&priorGpa<=5)addCourse(cumulative,{id:'prior-gpa-aggregate',name:'Prior coursework (manual)',credits:priorCredits,gpa:priorGpa},true,true);
 for(const bucket of [current,cumulative]){bucket.gpa=bucket.credits?bucket.qualityPoints/bucket.credits:null;bucket.assumedCredits=bucket.rows.some(r=>r.assumedCredits);bucket.estimated=bucket.rows.some(r=>r.basis==='current-estimate');}
 return {current,cumulative,selectedTerm,terms,scale,termReason,ambiguousTerm:!explicit&&!selectedTerm&&new Set(unique.filter(c=>isCurrentCourse(c,now)).map(termKeyOf).filter(Boolean)).size>1};
}
export function requiredFinal(current,goal,weight) {
 const w=Number(weight)/100;if(![Number(current),Number(goal),w].every(Number.isFinite)||w<=0||w>1)throw Error('Final weight must be greater than 0 and at most 100%.');
 return (Number(goal)-Number(current)*(1-w))/w;
}
export function assignmentGrade(assignments,groups=[]) {
 const scored=assignments.filter(a=>a.score!==null&&a.score!==undefined&&a.score!==''&&Number(a.points)>0&&!a.excused);
 if(!groups.length){const points=scored.reduce((s,a)=>s+Number(a.points),0);return points?100*scored.reduce((s,a)=>s+Number(a.score),0)/points:null;}
 let sum=0,weight=0;
 for(const group of groups){const a=scored.filter(a=>a.group===group.id),p=a.reduce((s,x)=>s+Number(x.points),0);if(p&&group.weight>0){sum+=100*a.reduce((s,x)=>s+Number(x.score),0)/p*group.weight;weight+=group.weight;}}
 return weight?sum/weight:null;
}
export function isDark(settings,date=new Date(),system=false) {
 if(settings.mode==='system')return system;if(settings.mode==='dark')return true;if(settings.mode!=='schedule')return false;
 const parse=t=>t.split(':').reduce((h,m,i)=>i?h+Number(m):Number(m)*60,0),n=date.getHours()*60+date.getMinutes(),s=parse(settings.darkStart),e=parse(settings.darkEnd);
 return s===e?true:s<e?n>=s&&n<e:n>=s||n<e;
}
export function activeTheme(settings,date=new Date(),system=false) {
 const t={...settings.theme};if(isDark(settings,date,system)&&!t.dark)return {...themes[1],accent:t.accent,palette:t.palette,font:settings.font};return {...t,font:settings.font};
}
export function studyFromText(text) {
 return text.split(/\n+/).map(line=>line.replace(/^[-*#\d.\s]+/,'').trim()).filter(Boolean).flatMap(line=>{
 const match=line.match(/^(.{2,100}?)\s*(?::|\s[-–—]\s|\s=\s)\s*(.{2,})$/);
 return match?[{id:uid(),front:match[1].trim(),back:match[2].trim()}]:[];
 });
}
const icsEscape = s=>String(s??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
const stamp=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
export function calendarICS(tasks,now=new Date()) {
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Open Campus//Planner//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
 for(const task of tasks){const start=task.workStart||task.due;if(!start||!Number.isFinite(Date.parse(start)))continue;const end=task.workEnd||new Date(Date.parse(start)+Number(task.minutes||30)*60000);
 lines.push('BEGIN:VEVENT',`UID:${icsEscape(task.id)}@open-campus`,`DTSTAMP:${stamp(now)}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,`SUMMARY:${icsEscape(task.title)}`,`DESCRIPTION:${icsEscape(task.notes||'')}`,`STATUS:${task.done?'CANCELLED':'CONFIRMED'}`,'END:VEVENT');}
 lines.push('END:VCALENDAR');
 // RFC 5545 physical lines are at most 75 octets, including continuation space.
 return lines.flatMap(line=>{let result=[],part='',bytes=0;for(const ch of line){const n=new TextEncoder().encode(ch).length;if(bytes+n>75){result.push(part);part=' ';bytes=1;}part+=ch;bytes+=n;}result.push(part);return result;}).join('\r\n')+'\r\n';
}
export function calendarLink(task,provider='google') {
 const start=task.workStart||task.due;if(!start)throw Error('Add a due date or work time first.');
 const end=task.workEnd||new Date(Date.parse(start)+Number(task.minutes||30)*60000).toISOString();
 if(provider==='google'){const p=new URLSearchParams({action:'TEMPLATE',text:task.title,dates:`${stamp(start)}/${stamp(end)}`});return `https://calendar.google.com/calendar/render?${p}`;}
 return `https://outlook.live.com/calendar/0/deeplink/compose?${new URLSearchParams({subject:task.title,startdt:new Date(start).toISOString(),enddt:new Date(end).toISOString()})}`;
}
export function safeURL(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export function mergeLMS(state,payload){
 const courses=new Map(state.courses.map(c=>[c.id,c]));for(const c of payload.courses){const old=courses.get(c.id);courses.set(c.id,{credits:3,goal:90,...old,...c,credits:old?.credits??c.credits??3,creditsAssumed:old?.credits!==undefined?old.creditsAssumed===true:c.credits===undefined,gpaExclude:old?.gpaExclude??false,manualGrade:old?.manualGrade,manualLetter:old?.manualLetter,goal:old?.goal??90,history:[...(old?.history||[]),...(c.grade!=null&&old?.grade!==c.grade?[{day:dayKey(),grade:c.grade}]:[])]});}state.courses=[...courses.values()];
 const tasks=new Map(state.tasks.map(t=>[t.id,t]));for(const t of payload.tasks){const old=tasks.get(t.id),newlySubmitted=t.submitted===true&&old?.submitted!==true,legacyOverride=old?.source==='canvas'&&old.done===true&&old.submitted===false?true:undefined,localDoneOverride=newlySubmitted?undefined:old?.localDoneOverride??legacyOverride,done=newlySubmitted?true:localDoneOverride??(old?.source==='canvas'||t.source==='canvas'?t.done??old?.done??false:old?.done??t.done??false);tasks.set(t.id,{...old,...t,done,localDoneOverride,subtasks:old?.subtasks||[],workStart:old?.workStart||'',workEnd:old?.workEnd||'',notes:old?.notes||''});}state.tasks=[...tasks.values()];return state;
}
