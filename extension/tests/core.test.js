import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,gpa,gradePoint,requiredFinal,assignmentGrade,isDark,streak,recordActivity,calendarICS,calendarLink,mergeLMS,mergeImport,studyFromText,safeURL} from '../src/core.js';
import {findMatches,clearLines} from '../src/games.js';
test('GPA weights by credits, excludes unknown grades, and supports high-school rigor',()=>{const courses=[{grade:95,credits:3},{grade:85,credits:1},{grade:null,credits:3}];assert.equal(gpa(courses),3.75);assert.equal(gpa([{grade:92,credits:1,rigor:1}],'highschool'),5);assert.equal(gradePoint(50,'highschool',1),0);assert.equal(gpa([]),null);});
test('final goal and assignment calculations treat missing scores correctly',()=>{assert.equal(requiredFinal(80,90,20),130);assert.throws(()=>requiredFinal(80,90,0));assert.equal(assignmentGrade([{score:0,points:20},{score:80,points:100},{score:null,points:100}]),100*80/120);assert.equal(assignmentGrade([{score:20,points:20,group:1},{score:50,points:100,group:2}],[{id:1,weight:25},{id:2,weight:75}]),62.5);});
test('dark scheduling supports overnight and daytime windows',()=>{const s={mode:'schedule',darkStart:'19:00',darkEnd:'07:00'};assert.equal(isDark(s,new Date(2026,9,14,23)),true);assert.equal(isDark(s,new Date(2026,9,14,12)),false);assert.equal(isDark({...s,darkStart:'09:00',darkEnd:'17:00'},new Date(2026,9,14,10)),true);});
test('activity deduplication prevents repeatedly earning task XP',()=>{const s=initial(),now=new Date(2026,9,14,12);recordActivity(s,'task','task1',now);recordActivity(s,'task','task1',now);assert.equal(s.activity.length,1);recordActivity(s,'task','task2',new Date(2026,9,13,12));assert.equal(streak(s,now),2);assert.equal(streak(s,new Date(2026,9,15,12)),2);assert.equal(streak(s,new Date(2026,9,16,12)),0);});
test('LMS refresh preserves student planning and uses separate course origins',()=>{const s=initial();s.tasks=[{id:'site|1',done:true,notes:'my note',workStart:'2026-10-14',subtasks:[{title:'read',done:true}]}];s.courses=[{id:'site|c',credits:5,goal:95,grade:80}];mergeLMS(s,{tasks:[{id:'site|1',title:'New title',done:false}],courses:[{id:'site|c',name:'Class',grade:90}]});assert.equal(s.tasks[0].done,true);assert.equal(s.tasks[0].notes,'my note');assert.equal(s.courses[0].credits,5);assert.equal(s.courses[0].goal,95);assert.equal(s.courses[0].history.length,1);});
test('Canvas task completion keeps local choices until a new submission arrives',()=>{const s=initial(),base={id:'canvas-task',source:'canvas',submitted:false,done:false};s.tasks=[{...base,done:true,localDoneOverride:true}];mergeLMS(s,{courses:[],tasks:[base]});assert.equal(s.tasks[0].done,true);mergeLMS(s,{courses:[],tasks:[{...base,submitted:true,done:true}]});assert.equal(s.tasks[0].done,true);assert.equal(s.tasks[0].localDoneOverride,undefined);s.tasks[0].done=false;s.tasks[0].localDoneOverride=false;mergeLMS(s,{courses:[],tasks:[{...base,submitted:true,done:true}]});assert.equal(s.tasks[0].done,false);});
test('ICS escapes text, uses stable IDs and folds UTF-8 lines at 75 octets',()=>{const text=calendarICS([{id:'stable',title:'Exam, review; café '+'🌱'.repeat(70),due:'2026-10-15T14:00:00Z',notes:'one\ntwo'}],new Date('2026-10-14T00:00:00Z'));assert.match(text,/UID:stable@open-campus/);assert.match(text,/Exam\\, review\\;/);assert.match(text,/DTSTART:20261015T140000Z/);assert.match(text,/DESCRIPTION:one\\ntwo/);for(const line of text.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);});
test('calendar provider URLs exclude private task notes',()=>{const task={title:'Review notes',notes:'Private medical information',due:'2026-10-15T14:00:00Z'};for(const provider of ['google','outlook']){const url=calendarLink(task,provider);assert.ok(url.includes('Review+notes'));assert.ok(!url.includes('Private'));assert.ok(!url.includes('medical'));}});
test('backup restore preserves approved origins and rejects malformed shapes',()=>{const s=initial(),data=initial();s.settings.lmsOrigins=['https://school.example'];data.settings.lmsOrigins=['https://evil.example'];assert.deepEqual(mergeImport(s,data).settings.lmsOrigins,s.settings.lmsOrigins);assert.throws(()=>mergeImport(s,{schema:2}));assert.throws(()=>mergeImport(s,{...data,tasks:{}}));assert.throws(()=>mergeImport(s,{...data,courses:[{id:'1',name:'Injected',credits:'<img>',goal:90}]}));});
test('study parser preserves colons in definitions and blocks executable URLs',()=>{const cards=studyFromText('Mitosis : division: two cells\nNo delimiter');assert.equal(cards.length,1);assert.equal(cards[0].back,'division: two cells');assert.equal(safeURL('javascript:alert(1)'), '');});
test('blocks score intersecting lines once and charms detect runs',()=>{const board=Array(36).fill(0);for(let i=0;i<6;i++){board[i]=1;board[i*6]=1;}assert.deepEqual(clearLines(board),{rows:1,columns:1,cells:11});assert.equal(board.reduce((a,b)=>a+b),0);const charms=Array.from({length:36},(_,i)=>i%5);charms[0]=charms[1]=charms[2]=4;assert.ok(findMatches(charms).includes(0));assert.ok(findMatches(charms).includes(2));});

test('assignment what-if applies drop rules, never-drop, and course weighting choice',()=>{
 const groups=[{id:1,weight:75,dropLowest:1,neverDrop:['a']},{id:2,weight:25,dropHighest:1}];
 const list=[{id:'a',canvasId:'a',group:1,score:10,points:100},{id:'b',group:1,score:50,points:100},{id:'c',group:1,score:90,points:100},{id:'d',group:2,score:100,points:10},{id:'e',group:2,score:5,points:10}];
 // Group 1 drops b (a is protected): (10+90)/200=50%. Group 2 drops its highest: 50%. Weighted: 50.
 assert.equal(assignmentGrade(list,groups),50);
 // Unweighted: points of kept work across groups = (10+90+5)/210.
 assert.equal(assignmentGrade(list,groups,false).toFixed(4),(100*105/210).toFixed(4));
 // Drop rules never remove the last scored assignment in a group.
 assert.equal(assignmentGrade([{id:'x',group:1,score:7,points:10}],[{id:1,weight:100,dropLowest:3}]),70);
});

test('playlist embeds only map known providers to their HTTPS embed players',async()=>{
 const {embedURL}=await import('../src/core.js');
 assert.equal(embedURL('https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TtZa6?si=x'),'https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI2TtZa6');
 assert.equal(embedURL('https://www.youtube.com/watch?v=jfKfPfyJRdk&list=PL123_abc'),'https://www.youtube-nocookie.com/embed/videoseries?list=PL123_abc');
 assert.equal(embedURL('https://youtu.be/jfKfPfyJRdk'),'https://www.youtube-nocookie.com/embed/jfKfPfyJRdk');
 assert.equal(embedURL('https://music.apple.com/us/playlist/focus/pl.u-abc'),'https://embed.music.apple.com/us/playlist/focus/pl.u-abc');
 for(const bad of ['javascript:alert(1)','http://open.spotify.com/playlist/x','https://evil.example/playlist/x','https://www.youtube.com/watch?v="><script>']) assert.equal(embedURL(bad),'');
});
