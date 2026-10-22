/* CourseLark: original, account-aware dashboard decoration. */
(async () => {
  const legalVersion = '2026-10-21.2';
  if (globalThis.__openCampusInjected) return;
  globalThis.__openCampusInjected = true;
  let state = (await chrome.storage.local.get('campus')).campus;
  if (state?.legalAcceptance?.version !== legalVersion || !state?.settings?.lmsOrigins?.includes(location.origin)) return;
  if (window === top) chrome.runtime.sendMessage({type: 'AUTO_SYNC'}).catch(() => {});
  const {safeBackground,applyFont}=await import(chrome.runtime.getURL('src/theme-runtime.js'));
  const style = document.createElement('style'); style.id = 'open-campus-style'; document.head.append(style);
  const widgetStyle = document.createElement('style'); widgetStyle.id = 'open-campus-widgets-style'; document.head.append(widgetStyle);
  widgetStyle.textContent = `#open-campus-gpa,#open-campus-todo,#open-campus-gpa-dialog,#open-campus-task-dialog{box-sizing:border-box;color:#263641;font:14px/1.45 system-ui,-apple-system,sans-serif}#open-campus-gpa *,#open-campus-todo *,#open-campus-gpa-dialog *,#open-campus-task-dialog *{box-sizing:border-box}#open-campus-gpa button,#open-campus-todo button,#open-campus-gpa-dialog button,#open-campus-task-dialog button{cursor:pointer;font:inherit}#open-campus-gpa{background:#fff;border:1px solid #dfe4e8;border-radius:14px;padding:20px 22px;margin:18px 0 26px;max-width:650px;box-shadow:0 1px 3px #1d344012}#open-campus-gpa .oc-head,#open-campus-todo .oc-head{display:flex;align-items:center;justify-content:space-between;gap:10px}#open-campus-gpa h2,#open-campus-todo h2{font-size:17px;margin:0;font-weight:750;line-height:1.2}#open-campus-gpa .oc-head button,#open-campus-todo .oc-head button{border:1px solid #d9e0e4;background:#fff;color:#43535b;border-radius:9px;padding:5px 8px}#open-campus-gpa .oc-metrics{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0 8px}#open-campus-gpa .oc-metric{border:1px solid #dfe3e8;background:#fbfcfd;border-radius:13px;text-align:center;padding:14px 5px}#open-campus-gpa .oc-metric span{display:block;color:#64747b}#open-campus-gpa .oc-metric strong{display:block;font-size:40px;letter-spacing:-2px;line-height:1.15;margin:5px 0;color:#22343e}#open-campus-gpa .oc-foot{font-size:12px;color:#66777b;margin-top:11px}#open-campus-gpa .oc-foot button{border:0;background:transparent;color:#376a5b;text-decoration:underline;padding:0}#open-campus-todo{background:#fff;padding:12px 0 30px;margin:0 0 18px;max-width:360px}#open-campus-todo .oc-head{border-bottom:1px solid #e4e7eb;padding-bottom:10px}#open-campus-todo .oc-controls{display:flex;align-items:center;justify-content:space-between;gap:4px;margin:12px 0}#open-campus-todo select,#open-campus-todo .oc-controls button{border:1px solid #d6dde1;border-radius:8px;background:#fff;color:#35474e;padding:6px 7px}#open-campus-todo .oc-controls span{white-space:nowrap;font-size:12px;font-weight:650}#open-campus-todo .oc-progress{display:flex;align-items:center;gap:12px;padding:9px 0 14px}#open-campus-todo .oc-progress-ring{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#76b49a var(--oc-progress),#e8eeed 0)}#open-campus-todo .oc-progress-ring span{display:grid;place-items:center;background:#fff;width:44px;height:44px;border-radius:50%;font-weight:800;font-size:13px}#open-campus-todo .oc-progress p{margin:0;color:#607078;font-size:12px}#open-campus-todo .oc-progress strong{display:block;color:#263641;font-size:16px}#open-campus-todo .oc-tabs{display:flex;background:#f1f3f4;border-radius:11px;padding:3px;gap:3px;margin-bottom:13px}#open-campus-todo .oc-tabs button{border:0;background:transparent;flex:1;border-radius:9px;padding:6px;color:#52636a}#open-campus-todo .oc-tabs button[aria-selected=true]{background:#fff;box-shadow:0 1px 4px #152a2830;color:#253e36;font-weight:750}#open-campus-todo .oc-section{margin:17px 0 8px;font-weight:800;font-size:12px;color:#43535b;letter-spacing:.03em}#open-campus-todo .oc-task{display:grid;grid-template-columns:5px 1fr 25px;border:1px solid #dce1e5;border-radius:13px;overflow:hidden;margin:8px 0;min-height:78px;box-shadow:0 1px 2px #0001}#open-campus-todo .oc-task .oc-strip{background:var(--oc-course,#577c6e)}#open-campus-todo .oc-task .oc-body{padding:8px 5px 8px 10px;min-width:0}#open-campus-todo .oc-task small{font-weight:750;color:var(--oc-course,#577c6e)}#open-campus-todo .oc-task a{display:block;color:#263641!important;font-size:14px;font-weight:700;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:none}#open-campus-todo .oc-task a:hover{text-decoration:underline}#open-campus-todo .oc-task .oc-due{display:flex;justify-content:space-between;gap:6px;font-size:11px;color:#6e7d82;margin-top:3px}#open-campus-todo .oc-task .oc-due span{white-space:nowrap}#open-campus-todo .oc-task button{align-self:start;border:2px solid var(--oc-course,#577c6e);border-radius:50%;width:19px;height:19px;background:#fff;margin:9px 6px 0 0;padding:0;line-height:14px;color:var(--oc-course,#577c6e);font-size:12px}#open-campus-todo .oc-task button[aria-pressed=true]{background:var(--oc-course,#577c6e);color:#fff}#open-campus-todo .oc-empty{padding:16px;border:1px dashed #cddad4;border-radius:12px;color:#64747b;text-align:center}#open-campus-todo .oc-add{border:1px solid #cedbd4;background:#f8fbf9;color:#315a49;border-radius:9px;padding:7px 10px;width:100%;margin-top:10px}#open-campus-gpa-dialog,#open-campus-task-dialog{width:min(460px,90vw);max-height:85vh;overflow:auto;border:1px solid #d4dfe0;border-radius:18px;background:#fff;color:#263641;padding:24px;box-shadow:0 20px 70px #0003}#open-campus-gpa-dialog::backdrop,#open-campus-task-dialog::backdrop{background:#1627208a}#open-campus-gpa-dialog h2,#open-campus-task-dialog h2{margin:0 0 14px;font-size:21px}#open-campus-gpa-dialog label,#open-campus-task-dialog label{display:block;margin:12px 0;font-weight:650}#open-campus-gpa-dialog input,#open-campus-gpa-dialog select,#open-campus-task-dialog input,#open-campus-task-dialog select{display:block;width:100%;border:1px solid #ccd6d8;border-radius:8px;padding:8px;margin-top:4px;color:#263641;background:#fff}#open-campus-gpa-dialog .oc-actions,#open-campus-task-dialog .oc-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}#open-campus-gpa-dialog .oc-actions button,#open-campus-task-dialog .oc-actions button{border:1px solid #cbd8d1;border-radius:9px;background:#fff;padding:8px 12px}#open-campus-gpa-dialog .oc-actions button[type=submit],#open-campus-task-dialog .oc-actions button[type=submit]{background:#366c54;color:#fff;border-color:#366c54}#right-side-wrapper:has(#open-campus-todo) [data-testid=ToDoSidebar]{display:none!important}`;
  widgetStyle.textContent += `#open-campus-panel{position:fixed;inset:3vh 3vw;width:94vw;height:94vh;max-width:none;max-height:none;margin:auto;padding:0;border:1px solid #dfe1e9;border-radius:22px;background:#f8f8fa;box-shadow:0 22px 90px #08161e70;overflow:hidden;z-index:2147483647}#open-campus-panel::backdrop{background:#14202db0;backdrop-filter:blur(3px)}#open-campus-panel .oc-panel-bar{height:49px;display:flex;align-items:center;justify-content:space-between;padding:0 16px 0 22px;background:#f8f8fa;color:#263641;font:700 15px system-ui,-apple-system,sans-serif;border-bottom:1px solid #e4e5ea}#open-campus-panel .oc-panel-bar button{height:34px;width:34px;border:1px solid #d8dce5;border-radius:11px;background:#fff;color:#273642;font:24px/1 system-ui;cursor:pointer}#open-campus-panel iframe{display:block;width:100%;height:calc(100% - 49px);border:0;background:#fff}@media(max-width:700px){#open-campus-panel{inset:1vh 1vw;width:98vw;height:98vh;border-radius:14px}}`;
  const originals = new WeakMap();
  const media = matchMedia('(prefers-color-scheme: dark)');
  const todoView = {range:'week', offset:0, tab:'open'};
  const launch = document.createElement('button'); launch.id = 'open-campus-launch'; launch.textContent = '✦ CourseLark';
  launch.type = 'button'; document.body.append(launch);
  const panelPages = new Set(['dashboard','tasks','planner','grades','notes','study','themes','focus','settings']);
  function openPanel(page = 'dashboard') {
    if (state?.legalAcceptance?.version !== legalVersion || !state?.settings?.lmsOrigins?.includes(location.origin)) return false;
    if (!panelPages.has(page)) return false;
    let panel = document.querySelector('#open-campus-panel');
    if (!panel) {
      panel = document.createElement('dialog'); panel.id = 'open-campus-panel'; panel.setAttribute('aria-label','CourseLark workspace');
      const bar = make('div',null,'oc-panel-bar'), title = make('strong','✦ CourseLark');
      const close = make('button','×'); close.type='button'; close.setAttribute('aria-label','Close CourseLark panel'); close.addEventListener('click',()=>panel.close());
      bar.append(title,close);
      const frame = document.createElement('iframe'); frame.title='CourseLark workspace'; frame.setAttribute('allow','microphone');
      frame.src = chrome.runtime.getURL('index.html');
      panel.append(bar,frame); document.body.append(panel);
      panel.addEventListener('close',()=>panel.remove());
    }
    const frame=panel.querySelector('iframe');
    if(panel.dataset.page!==page){frame.src=chrome.runtime.getURL('index.html')+(page==='dashboard'?'':'#'+page);panel.dataset.page=page;}
    if (!panel.open) panel.showModal();
    return true;
  }
  launch.addEventListener('click', () => openPanel());
  chrome.runtime.onMessage.addListener((message,_sender,respond)=>{
    if(message?.type!=='OPEN_PANEL')return;
    respond({ok:openPanel(message.page||'dashboard')});
  });
  function mountLaunch() {
    const menu=document.querySelector('#menu');
    if(menu){let item=document.querySelector('#open-campus-nav-item');if(!item){item=make('li');item.id='open-campus-nav-item';item.className='ic-app-header__menu-list-item';menu.insertBefore(item,menu.children[1]||null);}launch.style.cssText='width:100%;border:0;background:transparent;color:inherit;text-align:center;padding:11px 4px;font:700 11px/1.3 system-ui;cursor:pointer';item.append(launch);}
    else{launch.style.cssText='position:fixed;bottom:18px;left:18px;z-index:2147483646;padding:10px 16px;border-radius:24px;border:1px solid #7b9985;background:#fff;color:#294438;font:600 14px system-ui;box-shadow:0 3px 16px #0002;cursor:pointer';document.body.append(launch);}
  }
  const defaults = {bg: '#101922', surface: '#192630', text: '#dce9f0'};
  const color = (value, fallback) => /^#[\da-f]{6}$/i.test(value) ? value : fallback;
  const finite = (value, fallback, min, max) => Number.isFinite(Number(value)) && value !== '' && value != null ? Math.max(min, Math.min(max, Number(value))) : fallback;
  function dark(s) {
    if (s.mode === 'dark') return true;
    if (s.mode === 'system') return media.matches;
    if (s.mode !== 'schedule') return false;
    const minutes = value => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? value.split(':').map(Number).reduce((h, m, i) => i ? h + m : h * 60, 0) : null;
    const start = minutes(s.darkStart), end = minutes(s.darkEnd), now = new Date(), current = now.getHours() * 60 + now.getMinutes();
    if (start == null || end == null) return false;
    return start === end || (start < end ? current >= start && current < end : current >= start || current < end);
  }
  function safeUrl(value) {
    try { const u = new URL(value, location.origin); return u.protocol === 'https:' || (u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname)) ? u.href : ''; } catch { return ''; }
  }
  function isActiveCourse(course, id) {
    if (!course || (course.sourceOrigin && course.sourceOrigin !== location.origin)) return false;
    const active = state.settings.activeAccounts?.[location.origin];
    if (course.userId && active && String(course.userId) !== String(active)) return false;
    try { return new URL(course.url, location.origin).origin === location.origin && new URL(course.url, location.origin).pathname.replace(/\/$/, '') === '/courses/' + id; } catch { return false; }
  }
  function restore(node, original) {
    if (!node || original === undefined) return;
    if (original === null) node.removeAttribute('style'); else node.setAttribute('style', original);
  }
  function make(tag, text, className) { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; }
  function preview(task, theme) {
    document.querySelector('#open-campus-preview')?.remove();
    const dialog = make('dialog'); dialog.id = 'open-campus-preview'; dialog.setAttribute('aria-label', task.title || 'Assignment preview');
    dialog.style.cssText = `max-width:600px;width:85vw;border:1px solid #7d9989;border-radius:18px;padding:24px;background:${theme.surface};color:${theme.text};font:14px/1.6 system-ui;z-index:2147483647`;
    const title = make('h2', task.title), body = make('p');
    // Canvas descriptions are untrusted HTML. Strip to inert text, excluding script/style contents.
    const parsed = new DOMParser().parseFromString(String(task.description || ''), 'text/html');
    parsed.querySelectorAll('script,style,iframe,object').forEach(n => n.remove());
    body.textContent = parsed.body.textContent || 'No description provided.';
    body.style.cssText = 'white-space:pre-wrap;max-height:50vh;overflow:auto';
    const close = make('button', 'Close'); close.type = 'button'; close.addEventListener('click', () => dialog.close());
    const url = safeUrl(task.url); if (url) { const link = make('a', 'Open assignment ↗'); link.href = url; link.target = '_blank'; link.rel = 'noopener'; link.style.marginRight = '20px'; dialog.append(title, body, link, close); }
    else dialog.append(title, body, close);
    document.body.append(dialog); dialog.addEventListener('close', () => dialog.remove(), {once: true}); dialog.showModal();
  }
  async function saveChange(change) {
    const latest = (await chrome.storage.local.get('campus')).campus;
    if (!latest) return;
    change(latest); latest.revision = crypto.randomUUID();
    await chrome.storage.local.set({campus: latest});
  }
  function courseFor(task) { return (state.courses || []).find(c => c.id === task.courseId); }
  function relevantTask(task) {
    if (task.sourceOrigin && task.sourceOrigin !== location.origin) return false;
    const active = state.settings.activeAccounts?.[location.origin];
    if (task.userId && active && String(task.userId) !== String(active)) return false;
    const course = courseFor(task);
    return !course || !course.sourceOrigin || course.sourceOrigin === location.origin;
  }
  async function gpaData() {
    const result=await chrome.runtime.sendMessage({type:'GPA_SUMMARY'});
    if(!result?.ok) throw Error(result?.error||'GPA data is unavailable.');
    return result.summary;
  }
  async function openGpaSettings() {
    document.querySelector('#open-campus-gpa-dialog')?.remove();
    const data=await gpaData(), dialog=make('dialog');dialog.id='open-campus-gpa-dialog';
    const form=make('form');form.method='dialog';form.innerHTML='<h2>GPA settings</h2><p>Set the scale and credits used for this estimate. Canvas percentages may differ from final transcript grades.</p><label>Grading scale<select name="scale"><option value="whole">Whole letters: A 4, B 3, C 2, D 1, F 0</option><option value="plusMinus">Plus and minus letters</option></select></label><label>Current term<select name="term"></select></label><label>Term GPA goal<input name="termGoal" type="number" min="0" max="5" step="0.01"></label><label>Earlier completed credits<input name="priorCredits" type="number" min="0" max="1000" step="0.5"></label><label>GPA for those earlier credits<input name="priorGpa" type="number" min="0" max="5" step="0.01"></label><div class="oc-actions"><button type="button" class="oc-cancel">Cancel</button><button type="submit">Save</button></div>';
    form.elements.scale.value=data.scale;
    const termSelect=form.elements.term;const auto=make('option','Current term (automatic)');auto.value='auto';termSelect.append(auto);for(const term of data.terms){const opt=make('option',term.name);opt.value=term.key;termSelect.append(opt);}termSelect.value=state.settings.gpaTermKey||'auto';
    form.elements.termGoal.value=state.settings.termGpaGoal??'';form.elements.priorCredits.value=state.settings.priorCredits||'';form.elements.priorGpa.value=state.settings.priorGpa??'';
    const list=make('div');list.append(make('h3','Included courses'));
    for(const course of (state.courses||[]).filter(c=>c.grade!=null&&Number.isFinite(Number(c.grade))&&(!c.sourceOrigin||c.sourceOrigin===location.origin))){const row=make('div');row.style.cssText='display:grid;grid-template-columns:1fr 70px;align-items:center;gap:8px;border-top:1px solid #e5e9e9;padding:7px 0';const name=make('label');name.style.margin='0';const check=make('input');check.type='checkbox';check.checked=!course.gpaExclude;check.className='oc-include';check.dataset.id=course.id;check.style.cssText='display:inline;width:auto;margin:0 7px 0 0';name.append(check,make('span',`${course.code||course.name} (${Number(course.grade).toFixed(1)}%)`));const credit=make('input');credit.type='number';credit.min='0';credit.max='30';credit.step='0.5';credit.value=course.credits??3;credit.setAttribute('aria-label',`Credits for ${course.code||course.name}`);credit.className='oc-credit';credit.dataset.id=course.id;row.append(name,credit);list.append(row);}form.querySelector('.oc-actions').before(list);
    form.querySelector('.oc-cancel').addEventListener('click',()=>dialog.close());
    form.addEventListener('submit',async e=>{e.preventDefault();const v=form.elements;await saveChange(latest=>{latest.settings.gpaScale=v.scale.value;latest.settings.gpaTermKey=v.term.value;latest.settings.termGpaGoal=v.termGoal.value===''?null:Number(v.termGoal.value);latest.settings.priorCredits=Number(v.priorCredits.value)||0;latest.settings.priorGpa=Number(v.priorGpa.value)||0;for(const input of form.querySelectorAll('.oc-credit')){const c=latest.courses.find(item=>item.id===input.dataset.id);if(c){c.credits=Math.max(0,Math.min(30,Number(input.value)||0));c.creditsAssumed=false;}}for(const input of form.querySelectorAll('.oc-include')){const c=latest.courses.find(item=>item.id===input.dataset.id);if(c)c.gpaExclude=!input.checked;}});dialog.close();});
    dialog.append(form);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
  }
  async function renderGpa() {
    if(state.settings.showGpa===false){document.querySelector('#open-campus-gpa')?.remove();return;}
    const box=document.querySelector('.ic-DashboardCard__box');if(!box)return;
    let widget=document.querySelector('#open-campus-gpa');if(!widget){widget=make('section');widget.id='open-campus-gpa';box.before(widget);}
    const data=await gpaData();if(!widget.isConnected)return;widget.replaceChildren();
    const head=make('div',null,'oc-head'),h=make('h2','GPA overview'),settings=make('button','⚙');settings.type='button';settings.title='GPA settings';settings.setAttribute('aria-label','GPA settings');settings.addEventListener('click',()=>openGpaSettings().catch(()=>{}));head.append(h,settings);widget.append(head);
    const metrics=make('div',null,'oc-metrics');for(const [label,item] of [['Current term',data.current],['Cumulative',data.cumulative]]){const tile=make('div',null,'oc-metric');tile.append(make('span',label),make('strong',item.gpa==null?'—':item.gpa.toFixed(2)),make('span',`${item.credits} credits`));metrics.append(tile);}widget.append(metrics);
    const foot=make('div',null,'oc-foot');foot.append(make('span',`${data.selectedTerm?.name||'Active courses'} · ${data.scale==='whole'?'Whole-letter':'Plus/minus'} scale${Number.isFinite(Number(state.settings.termGpaGoal))&&state.settings.termGpaGoal!=null?' · Goal '+Number(state.settings.termGpaGoal).toFixed(2):''} · Estimate from imported scores${data.cumulative.assumedCredits?'; some classes assume 3 credits':''}. `));const detail=make('button','Edit calculation');detail.type='button';detail.addEventListener('click',()=>openGpaSettings().catch(()=>{}));foot.append(detail,make('span',' · '));const planner=make('button','Open grade planner');planner.type='button';planner.addEventListener('click',()=>openPanel('grades'));foot.append(planner);widget.append(foot);
  }
  function colorFor(course) {
    const over=state.settings.cardOverrides?.[course?.id];
    if(over?.color&&/^#[\da-f]{6}$/i.test(over.color))return over.color;
    const colors=['#2d8d57','#2f688e','#7056a3','#aa6544','#61794b'];
    const index=(state.courses||[]).findIndex(c=>c.id===course?.id);return colors[Math.max(index,0)%colors.length];
  }
  function taskWindow() {
    const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const days=todoView.range==='today'?1:todoView.range==='month'?30:7;
    start.setDate(start.getDate()+todoView.offset*days);const end=new Date(start);end.setDate(end.getDate()+days);
    const readable=d=>d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
    return {start,end,label:days===1?readable(start):`${readable(start)} – ${readable(new Date(end.getTime()-1))}`};
  }
  function openTaskDialog() {
    document.querySelector('#open-campus-task-dialog')?.remove();
    const dialog=make('dialog');dialog.id='open-campus-task-dialog';const form=make('form');form.method='dialog';
    form.innerHTML='<h2>Add a task</h2><label>Task name<input name="title" required maxlength="160"></label><label>Due date<input name="due" type="datetime-local" required></label><label>Course<select name="course"><option value="">General</option></select></label><div class="oc-actions"><button type="button" class="oc-cancel">Cancel</button><button type="submit">Add task</button></div>';
    const due=new Date(Date.now()+86400000);due.setHours(23,59,0,0);form.elements.due.value=`${due.getFullYear()}-${String(due.getMonth()+1).padStart(2,'0')}-${String(due.getDate()).padStart(2,'0')}T23:59`;
    for(const c of state.courses||[]){if(c.sourceOrigin&&c.sourceOrigin!==location.origin)continue;const opt=make('option',c.code||c.name);opt.value=c.id;form.elements.course.append(opt);}
    form.querySelector('.oc-cancel').addEventListener('click',()=>dialog.close());
    form.addEventListener('submit',async e=>{e.preventDefault();const v=form.elements,dueDate=new Date(v.due.value);if(!v.title.value.trim()||!Number.isFinite(dueDate.getTime()))return;await saveChange(latest=>latest.tasks.push({id:crypto.randomUUID(),title:v.title.value.trim(),due:dueDate.toISOString(),courseId:v.course.value||'',sourceOrigin:location.origin,done:false,source:'local'}));dialog.close();});
    dialog.append(form);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
  }
  function renderTodo() {
    if(state.settings.showTodo===false){document.querySelector('#open-campus-todo')?.remove();return;}
    const side=document.querySelector('#right-side-wrapper')||document.querySelector('#right-side');if(!side)return;
    let widget=document.querySelector('#open-campus-todo');if(!widget){widget=make('section');widget.id='open-campus-todo';side.prepend(widget);}
    widget.replaceChildren();
    const head=make('div',null,'oc-head'),title=make('h2','To-do list'),settings=make('button','⚙');settings.type='button';settings.title='Open task settings';settings.setAttribute('aria-label','Open task settings');settings.addEventListener('click',()=>{const menu=widget.querySelector('.oc-options');if(menu)menu.remove();else{const box=make('div',null,'oc-options');box.style.cssText='padding:10px;background:#f8faf9;border:1px solid #d9e2de;border-radius:10px;margin-top:8px';const label=make('label');label.append(make('span','Show overdue tasks for '));const select=make('select');for(const days of [0,7,14,30]){const o=make('option',days?`${days} days`:'Hide overdue');o.value=days;select.append(o);}select.value=String(state.settings.todoOverdueDays??7);select.addEventListener('change',async()=>saveChange(latest=>latest.settings.todoOverdueDays=Number(select.value)));label.append(select);box.append(label);head.after(box);}});head.append(title,settings);widget.append(head);
    const {start,end,label}=taskWindow();const controls=make('div',null,'oc-controls'),select=make('select');select.setAttribute('aria-label','To-do timeframe');for(const [value,text] of [['today','Today'],['week','Week'],['month','Month']]){const opt=make('option',text);opt.value=value;select.append(opt);}select.value=todoView.range;select.addEventListener('change',()=>{todoView.range=select.value;todoView.offset=0;safeApply();});const prev=make('button','‹'),next=make('button','›');prev.type=next.type='button';prev.setAttribute('aria-label','Previous timeframe');next.setAttribute('aria-label','Next timeframe');prev.addEventListener('click',()=>{todoView.offset--;safeApply();});next.addEventListener('click',()=>{todoView.offset++;safeApply();});controls.append(select,prev,make('span',label),next);widget.append(controls);
    const overdueDays=Number(state.settings.todoOverdueDays??7),overdueStart=new Date(start);overdueStart.setDate(overdueStart.getDate()-overdueDays);
    const tasks=(state.tasks||[]).filter(t=>relevantTask(t)&&Number.isFinite(Date.parse(t.due))&&Date.parse(t.due)<end.getTime()&&Date.parse(t.due)>=(todoView.offset===0?overdueStart:start).getTime()).sort((a,b)=>Date.parse(a.due)-Date.parse(b.due));
    const completed=tasks.filter(t=>t.done).length,progress=tasks.length?Math.round(completed/tasks.length*100):0;
    const p=make('div',null,'oc-progress'),ring=make('div',null,'oc-progress-ring');ring.style.setProperty('--oc-progress',progress+'%');ring.append(make('span',progress+'%'));const caption=make('p');caption.append(make('strong',`${completed} of ${tasks.length} complete`),make('span',tasks.length?'Keep moving through your week.':'No tasks in this timeframe.'));p.append(ring,caption);widget.append(p);
    const tabs=make('div',null,'oc-tabs');for(const [key,label] of [['open','To do'],['done','Completed']]){const b=make('button',label);b.type='button';b.setAttribute('aria-selected',String(todoView.tab===key));b.addEventListener('click',()=>{todoView.tab=key;safeApply();});tabs.append(b);}widget.append(tabs);
    const shown=tasks.filter(t=>!!t.done===(todoView.tab==='done'));
    if(!shown.length)widget.append(make('div',todoView.tab==='done'?'No completed tasks in this timeframe.':'Nothing due in this timeframe.','oc-empty'));
    let lastGroup='';const today=new Date();today.setHours(0,0,0,0);
    for(const task of shown){const due=new Date(task.due),day=new Date(due);day.setHours(0,0,0,0);const delta=Math.round((day.getTime()-today.getTime())/86400000);const group=delta<0?'OVERDUE':delta===0?'DUE TODAY':delta===1?'DUE TOMORROW':delta<7?`DUE IN ${delta} DAYS`:'DUE LATER';if(group!==lastGroup){widget.append(make('div',group,'oc-section'));lastGroup=group;}
      const course=courseFor(task),row=make('div',null,'oc-task');row.style.setProperty('--oc-course',colorFor(course));row.append(make('div',null,'oc-strip'));const body=make('div',null,'oc-body');body.append(make('small',course?.code||course?.name||'Personal'));const url=safeUrl(task.url),link=make(url?'a':'div',task.title);if(url){link.href=url;link.target='_blank';link.rel='noopener noreferrer';}body.append(link);const dueLine=make('div',null,'oc-due');dueLine.append(make('span',`Due ${due.toLocaleDateString(undefined,{month:'numeric',day:'numeric'})} at ${due.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}`));if(Number.isFinite(Number(task.points))&&task.points!=null)dueLine.append(make('span',`${task.points} pts`));body.append(dueLine);row.append(body);const complete=make('button',task.done?'✓':'');complete.type='button';complete.setAttribute('aria-label',(task.done?'Mark incomplete: ':'Mark complete: ')+task.title);complete.setAttribute('aria-pressed',String(!!task.done));complete.title=task.source==='canvas'?'Track completion in CourseLark; Canvas submission stays unchanged.':'Mark task complete';complete.addEventListener('click',()=>saveChange(latest=>{const target=latest.tasks.find(t=>t.id===task.id);if(target){target.done=!target.done;if(target.source==='canvas')target.localDoneOverride=target.done;}}));row.append(complete);widget.append(row);
    }
    const add=make('button','+ Add task','oc-add');add.type='button';add.addEventListener('click',openTaskDialog);widget.append(add);
  }
  function apply() {
    const connected = state?.legalAcceptance?.version === legalVersion && state?.settings?.lmsOrigins?.includes(location.origin);
    if (!connected) {
      observer?.disconnect();document.querySelector('#open-campus-font')?.remove(); style.remove(); widgetStyle.remove(); launch.remove();document.querySelector('#open-campus-nav-item')?.remove();
      for (const card of document.querySelectorAll('.ic-DashboardCard')) restoreCard(card);
      document.querySelector('#open-campus-preview')?.remove();
      document.querySelector('#open-campus-gpa')?.remove();document.querySelector('#open-campus-todo')?.remove();document.querySelector('#open-campus-gpa-dialog')?.remove();document.querySelector('#open-campus-task-dialog')?.remove();document.querySelector('#open-campus-panel')?.remove();
      return;
    }
    const s = state.settings;
    if(!style.isConnected)document.head.append(style);
    if(!widgetStyle.isConnected)document.head.append(widgetStyle);
    mountLaunch();
    let theme = s.theme || {};
    const themes = [theme, ...(state.themes || [])].filter(Boolean);
    if (s.rotate && themes.length) theme = themes[Math.floor(Date.now() / 86400000) % themes.length];
    if (dark(s) && !theme.dark) theme = {...theme, ...defaults};
    const bg = color(theme.bg, '#f4f6f1'), surface = color(theme.surface, '#ffffff'), text = color(theme.text, '#253831'), accent = color(theme.accent, '#4c7663');
    const font = applyFont(document,s.font);
    const sheet = `#header.ic-app-header{background:${safeBackground(theme.sidebar)||surface}!important}#header .ic-app-header__menu-list-link{color:${color(theme.sidebarText,text)}!important}${s.disableOverlay?'.ic-DashboardCard__header_hero{opacity:0!important}':''}${s.fullWidth?'#dashboard{max-width:none!important}.ic-DashboardCard__box{max-width:none!important}':''}#dashboard{--oc-surface:${surface};--oc-text:${text};--oc-accent:${accent};--oc-bg:${bg};font-family:${font};background:${bg};color:${text}}#open-campus-gpa,#open-campus-todo{background:${surface};color:${text}}.ic-DashboardCard{background:${surface}!important;color:${text}!important;border-radius:14px!important;box-shadow:0 2px 9px #172c2530!important;overflow:hidden}.ic-DashboardCard__header_content,.ic-DashboardCard__action-container{background:${surface}!important}.ic-DashboardCard__header-title{color:${accent}!important}.ic-DashboardCard__header-subtitle,.ic-DashboardCard__header-term{color:${text}!important}${s.hideLogo ? '#header .ic-app-header__logomark-container{display:none!important}' : ''}${s.hideFeedback ? '.recent_feedback{display:none!important}' : ''}${s.compact ? '.ic-DashboardCard{width:220px!important}.ic-DashboardCard__header_image{height:85px!important}' : ''}${s.cardLinks ? '' : '.ic-DashboardCard__action-container{display:none!important}'}#dashboard .ic-DashboardCard__header_image{position:relative}.open-campus-grade{position:absolute;top:15px;left:15px;z-index:4;background:#fff;color:#263b33;padding:5px 10px;border-radius:24px;font:700 14px system-ui;box-shadow:0 2px 6px #0002}.open-campus-card-extra{padding:12px 18px 16px;border-top:1px solid #80938d33;font:13px/1.5 ${font};min-height:48px}.open-campus-card-extra h3{font:700 15px ${font};margin:0 0 8px}.open-campus-card-extra a{display:flex;justify-content:space-between;gap:9px;margin:9px 0;color:${text};text-decoration:none}.open-campus-card-extra a:hover{text-decoration:underline}.open-campus-card-extra button{font:inherit;cursor:pointer}.open-campus-note{white-space:pre-wrap;padding:0 18px;font-size:12px}`;
    // User-authored CSS goes last; textContent keeps it inside the style element.
    const custom = typeof s.customCSS === 'string' ? '\n' + s.customCSS.slice(0, 20000) : '';
    if (style.textContent !== sheet + custom) style.textContent = sheet + custom;
    const palette = Array.isArray(theme.palette) && theme.palette.length ? theme.palette.map(c => color(c, accent)) : [accent];
    document.querySelectorAll('.ic-DashboardCard').forEach((card, index) => {
      const link = card.querySelector('a[href*="/courses/"]');
      let id; try { const u = new URL(link?.href); if (u.origin === location.origin) id = u.pathname.match(/^\/courses\/(\d+)(?:\/|$)/)?.[1]; } catch {}
      const course = id && (state.courses || []).find(c => isActiveCourse(c, id));
      const over = course && s.cardOverrides?.[course.id] || {};
      const header = card.querySelector('.ic-DashboardCard__header_image'), title = card.querySelector('.ic-DashboardCard__header-title'), subtitle = card.querySelector('.ic-DashboardCard__header-subtitle');
      if (!originals.has(card)) originals.set(card, {cardStyle: card.getAttribute('style'), headerStyle: header?.getAttribute('style'), title: title?.textContent, subtitle: subtitle?.textContent});
      const original = originals.get(card);
      restore(card, original.cardStyle); restore(header, original.headerStyle);
      if (over.hidden) card.style.display = 'none';
      if (title && title.textContent !== (over.name || original.title)) title.textContent = over.name || original.title;
      if (subtitle && subtitle.textContent !== (over.code || original.subtitle)) subtitle.textContent = over.code || original.subtitle;
      const cardColor = color(over.color, palette[index % palette.length]);
      if (header) {
        if (!original.headerStyle?.includes('background-image') || over.color || over.image) header.style.setProperty('background-color', cardColor, 'important');
        const hasThemeImages=Array.isArray(theme.images)&&theme.images.length>0;const themeImage=hasThemeImages?theme.images[index%theme.images.length]:'';const chosenImage=over.image||themeImage;const image = safeUrl(chosenImage); if (chosenImage && image) { header.style.setProperty('background-image', `url(${JSON.stringify(image)})`, 'important'); const zoom=finite(over.imageZoom,100,100,300);header.style.backgroundSize = zoom===100?'cover':`${zoom}% auto`;header.style.backgroundPosition = `${finite(over.imageX,50,0,100)}% ${finite(over.imageY,50,0,100)}%`; }else if(hasThemeImages||!original.headerStyle?.includes('background-image')){header.style.backgroundImage=s.gradient?`linear-gradient(135deg,${cardColor},${accent})`:'none';}
        if (over.brightness != null || over.blur != null) header.style.filter = `brightness(${finite(over.brightness, 100, 0, 200)}%) blur(${finite(over.blur, 0, 0, 40)}px)`;
      }
      let badge = card.querySelector('.open-campus-grade');
      if (s.showGrades && course?.grade != null && Number.isFinite(Number(course.grade))) {
        if (!badge && header) { badge = make('span', '', 'open-campus-grade'); header.append(badge); }
        const label = `${Number(course.grade).toFixed(1)}%`; if (badge.textContent !== label) badge.textContent = label;
        badge.title = 'Imported Canvas current score. Refresh the LMS import for updated grades.';
      } else badge?.remove();
      let noteEl = card.querySelector('.open-campus-note');
      const note = course && (state.notes || []).find(n => n.courseId === course.id);
      if (note && s.showNotes!==false) {
        if (!noteEl) { noteEl = make('p', '', 'open-campus-note'); card.append(noteEl); }
        const value = String(note.body || '').slice(0, 180); if (noteEl.textContent !== value) noteEl.textContent = value;
      } else noteEl?.remove();
      card.querySelector('.open-campus-card-extra')?.remove();
      const extra = make('div', null, 'open-campus-card-extra');
      const now = Date.now(), horizon = now + 14 * 86400000;
      const tasks = course && (state.tasks || []).filter(t => t.courseId === course.id && !t.done && Date.parse(t.due) >= now - 7 * 86400000 && Date.parse(t.due) <= horizon).sort((a, b) => Date.parse(a.due) - Date.parse(b.due)).slice(0, finite(s.assignmentCount,3,1,20)) || [];
      if(s.showAssignments!==false)extra.append(make('h3', 'Due'));
      if (s.showAssignments!==false && !tasks.length) extra.append(make('span', 'Nothing upcoming'));
      for (const task of s.showAssignments===false?[]:tasks) {
        const row = make('div'), url = safeUrl(task.url), a = make(url ? 'a' : 'span');
        a.append(make('span', task.title), make('time', new Date(task.due).toLocaleDateString(undefined, {month:'short',day:'numeric'}))); if (url) a.href = url;
        const show = make('button', '↗'); show.type = 'button'; show.setAttribute('aria-label', 'Preview ' + task.title); show.title = 'Preview assignment'; show.addEventListener('click', () => preview(task, {surface, text}));
        row.style.cssText='display:flex;align-items:center;gap:5px'; row.append(a);if(s.assignmentPreview!==false)row.append(show);extra.append(row);
      }
      for (const custom of Array.isArray(over.links) ? over.links : []) {
        const url = safeUrl(custom.url); if (!url) continue;
        const a = make('a', String(custom.label || custom.name || 'Link')); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; extra.append(a);
      }
      if(extra.childNodes.length)card.append(extra);
    });
    if (document.querySelector('#dashboard')) {renderGpa().catch(error=>{const widget=document.querySelector('#open-campus-gpa');if(widget)widget.textContent='GPA overview is unavailable. Refresh your Canvas import.';});renderTodo();}
  }
  function restoreCard(card) {
    const original = originals.get(card); if (!original) return;
    restore(card, original.cardStyle); restore(card.querySelector('.ic-DashboardCard__header_image'), original.headerStyle);
    const title = card.querySelector('.ic-DashboardCard__header-title'), subtitle = card.querySelector('.ic-DashboardCard__header-subtitle');
    if (title && original.title !== undefined) title.textContent = original.title;
    if (subtitle && original.subtitle !== undefined) subtitle.textContent = original.subtitle;
    card.querySelectorAll('.open-campus-grade,.open-campus-note,.open-campus-card-extra').forEach(n => n.remove());
  }
  let timer, observer;
  function safeApply() {
    observer?.disconnect();
    try { apply(); } finally { if (state?.legalAcceptance?.version === legalVersion && state?.settings?.lmsOrigins?.includes(location.origin)) observer?.observe(document.body, {childList: true, subtree: true}); }
  }
  observer = new MutationObserver(records => {
    const relevant = records.some(record => !record.target.closest?.('[class^="open-campus-"],#open-campus-preview,#open-campus-gpa,#open-campus-todo,#open-campus-gpa-dialog,#open-campus-task-dialog') && [...record.addedNodes, ...record.removedNodes].some(n => n.nodeType === 1 && !n.className?.startsWith?.('open-campus-') && !n.id?.startsWith('open-campus-')));
    if (relevant) { clearTimeout(timer); timer = setTimeout(safeApply, 150); }
  });
  safeApply();
  chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.campus?.newValue) { state = changes.campus.newValue; safeApply(); } });
  media.addEventListener('change', safeApply);
  setInterval(safeApply, 60000);
})();
