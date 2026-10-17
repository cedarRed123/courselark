import test from 'node:test';
import assert from 'node:assert/strict';
import {gpaSummary, gradePoint, initial, mergeLMS, isCurrentCourse, mergeImport} from '../src/core.js';
const now = new Date('2026-10-14T12:00:00Z'), origin='https://school.instructure.com';
const term=(id,name,start,end)=>({termId:id,termKey:origin+'|term:'+id,termName:name,termStart:start,termEnd:end});
const fall=term(2,'Fall 2026','2026-08-20','2026-12-20'), spring=term(1,'Spring 2026','2026-01-10','2026-05-20');
const c=(id,grade,credits=3,extra={})=>({id,name:id,grade,currentGrade:grade,credits,sourceOrigin:origin,userId:'7',enrollmentType:'student',enrollmentState:'active',...fall,...extra});

test('dashboard default whole-letter scale differs from optional plus/minus and legacy college scale',()=>{
 const courses=[c('math',92),c('biology',86)];
 assert.equal(gpaSummary(courses,{now}).current.gpa,3.5);
 assert.equal(gpaSummary(courses,{now,gpaScale:'plusMinus'}).current.gpa,3.35);
 assert.equal(gradePoint(92),3.7);assert.equal(gradePoint(92,'whole'),4);
 for(const value of [null,undefined,'','  ',true,[],{},NaN])assert.equal(gradePoint(value),null);
 assert.equal(gradePoint('A+','plusMinus'),4);assert.equal(gradePoint('B+','whole'),3);
});

test('current term excludes old/future classes, cumulative prefers historical final over unfinished-work score',()=>{
 const courses=[c('current',92,3),c('old',80,3,{...spring,concluded:true,finalGrade:95}),c('future',100,3,{...term(3,'Spring 2027','2027-01-10','2027-05-20')})];
 const summary=gpaSummary(courses,{now});assert.equal(summary.selectedTerm.name,'Fall 2026');
 assert.equal(summary.current.count,1);assert.equal(summary.current.gpa,4);
 assert.equal(summary.cumulative.count,2);assert.equal(summary.cumulative.gpa,4);
 assert.equal(summary.cumulative.rows.find(r=>r.id==='old').basis,'posted-final');
 assert.equal(summary.current.excluded.find(e=>e.id==='old').reason,'outside-current-term');
});

test('explicit term selection is stable and unknown selected term never silently averages everything',()=>{
 const courses=[c('new',82),c('past',80,3,{...spring,concluded:true,finalGrade:95})];
 assert.equal(gpaSummary(courses,{now,gpaTermKey:spring.termKey}).current.gpa,4);
 assert.equal(gpaSummary(courses,{now,gpaTermKey:'not-an-imported-term'}).current.gpa,null);
});

test('unknown organizations, pass/fail, hidden grades, exclusions and invalid credits do not lower GPA',()=>{
 const courses=[c('earned-f',0),c('organization',null,3,{finalGrade:0}),c('pass',100,3,{currentLetter:'P'}),c('hidden',95,3,{hideFinalGrades:true}),c('excluded',95,3,{gpaExclude:true}),c('zero-credits',95,0),c('bad-score','oops')];
 const summary=gpaSummary(courses,{now});assert.equal(summary.current.count,1);assert.equal(summary.current.gpa,0);assert.equal(summary.current.rows[0].id,'earned-f');
 assert.equal(summary.current.excluded.find(e=>e.id==='organization').reason,'ungraded');
});

test('posted school letter grades take precedence and manual overrides are explicit',()=>{
 assert.equal(gpaSummary([c('school-scale',89,3,{currentLetter:'A'})],{now}).current.gpa,4);
 assert.equal(gpaSummary([c('manual',80,3,{currentLetter:'B',manualGrade:95})],{now}).current.gpa,4);
 assert.ok(Math.abs(gpaSummary([c('letter-only',null,3,{currentLetter:'B+'})],{now,scale:'plusMinus'}).current.gpa-3.3)<1e-12);
});

test('credits are weighted, fallback credits disclosed, and ungraded courses never add credit',()=>{
 const summary=gpaSummary([c('a',95,5),c('b',85,1),{id:'unknown-credit',name:'Unknown credit',grade:75,...fall},c('none',null,10)],{now});
 assert.equal(summary.current.credits,9);assert.equal(summary.current.gpa,29/9);assert.equal(summary.current.assumedCredits,true);
 assert.equal(summary.current.rows.find(r=>r.id==='unknown-credit').credits,3);
 assert.equal(gpaSummary([c('a',95,5),c('b',85,1)],{now}).current.assumedCredits,false);
});

test('manual history and prior aggregate add credit-weighted cumulative points without changing current GPA',()=>{
 const summary=gpaSummary([c('current',90,3)],{now,priorCredits:12,priorGpa:3,gpaHistory:[{id:'old',name:'Transfer class',grade:80,credits:3},{id:'past-block',credits:6,gpa:2}]});
 assert.equal(summary.current.gpa,4);assert.equal(summary.cumulative.credits,24);assert.equal(summary.cumulative.gpa,69/24);
 assert.equal(summary.cumulative.rows.find(r=>r.id==='prior-gpa-aggregate').basis,'manual-gpa');
});

test('manual history may replace a specific imported course rather than double count it',()=>{
 const courses=[c('past',80,3,{...spring,concluded:true,finalGrade:80}),c('current',95,3)];
 const summary=gpaSummary(courses,{now,manualHistory:[{id:'corrected',courseId:'past',grade:95,credits:3}]});
 assert.equal(summary.cumulative.count,2);assert.equal(summary.cumulative.gpa,4);assert.ok(!summary.cumulative.rows.some(r=>r.id==='past'));
});

test('account/school scopes exclude other accounts while retaining manually entered classes',()=>{
 const courses=[c('mine',95),c('other-user',60,3,{userId:'8'}),c('other-school',60,3,{sourceOrigin:'https://elsewhere.test'}),{id:'manual',name:'Manual',grade:95,credits:3}];
 const summary=gpaSummary(courses,{now,origin,userId:'7',activeAccounts:{[origin]:'7'}});
 assert.equal(summary.current.count,2);assert.equal(summary.current.gpa,4);
});

test('multiple undated active terms expose ambiguity instead of inventing a semester',()=>{
 const summary=gpaSummary([c('a',95,3,{termStart:null,termEnd:null}),c('b',85,3,{...spring,termStart:null,termEnd:null})],{now});
 assert.equal(summary.selectedTerm,null);assert.equal(summary.ambiguousTerm,true);assert.equal(summary.current.count,2);
});

test('date-bound course restrictions override term bounds and completed enrollment is historical',()=>{
 assert.equal(isCurrentCourse(c('short',95,3,{restrictCourseDates:true,courseEnd:'2026-09-01'}),now),false);
 assert.equal(isCurrentCourse(c('extended',95,3,{...spring,restrictCourseDates:true,courseStart:'2026-08-01',courseEnd:'2026-12-01'}),now),true);
 assert.equal(isCurrentCourse(c('done',95,3,{enrollmentState:'completed'}),now),false);
});

test('refresh preserves manual credits, exclusion and grade adjustments plus final/term metadata',()=>{
 const state=initial();state.courses=[c('a',80,5,{gpaExclude:true,manualGrade:92,creditsAssumed:false})];
 mergeLMS(state,{courses:[c('a',85,undefined,{finalGrade:90,termName:'Updated term'})],tasks:[]});
 assert.equal(state.courses[0].credits,5);assert.equal(state.courses[0].gpaExclude,true);assert.equal(state.courses[0].manualGrade,92);assert.equal(state.courses[0].creditsAssumed,false);assert.equal(state.courses[0].finalGrade,90);
 assert.equal(gpaSummary(state,{now}).current.gpa,null);
 const fresh=initial();mergeLMS(fresh,{courses:[{id:'unknown-credit',grade:95}],tasks:[]});assert.equal(fresh.courses[0].creditsAssumed,true);
});

test('historical final scores never borrow the current letter, while current scores never use final zero',()=>{
 const summary=gpaSummary([c('past',70,3,{...spring,concluded:true,currentLetter:'C',finalGrade:95,finalLetter:null}),c('now',95,3,{finalGrade:0})],{now});
 assert.equal(summary.cumulative.gpa,4);assert.equal(summary.current.gpa,4);
});

test('GPA preferences and manual history survive backup; malformed credit aggregates are rejected',()=>{
 const state=initial(),backup=initial();backup.settings.gpaScale='plusMinus';backup.settings.priorGpa=3.2;backup.settings.priorCredits=12;backup.settings.gpaHistory=[{id:'transfer',name:'Transfer',grade:95,credits:3}];
 const restored=mergeImport(state,backup);assert.equal(restored.settings.priorCredits,12);assert.equal(restored.settings.gpaHistory.length,1);
 assert.throws(()=>mergeImport(state,{...backup,settings:{...backup.settings,priorGpa:-1}}));
 assert.throws(()=>mergeImport(state,{...backup,settings:{...backup.settings,gpaHistory:[{id:'bad',credits:3,gpa:'NaN'}]}}));
 assert.throws(()=>mergeImport(state,{...backup,settings:{...backup.settings,gpaHistory:[null]}}));
});

test('legacy backup without GPA settings migrates to whole scale and empty history',()=>{
 const legacy=initial();for(const key of ['gpaScale','gpaTermKey','gpaHistory','priorCredits','priorGpa'])delete legacy.settings[key];
 const restored=mergeImport(legacy,legacy);assert.equal(restored.settings.gpaScale,'whole');assert.equal(restored.settings.gpaTermKey,'auto');assert.deepEqual(restored.settings.gpaHistory,[]);
});

test('explicit future term preview uses current estimate rather than synthetic final zero',()=>{
 const future=term(3,'Spring 2027','2027-01-10','2027-05-20');const result=gpaSummary([c('preview',95,3,{...future,finalGrade:0})],{now,gpaTermKey:future.termKey});
 assert.equal(result.current.gpa,4);assert.equal(result.current.rows[0].basis,'current-estimate');assert.equal(result.cumulative.gpa,null);
});
