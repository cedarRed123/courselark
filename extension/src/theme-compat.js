import {fontName,localFonts,safeBackground} from './theme-runtime.js';
import {themes,uid} from './core.js';
export const displayToggles = [['rotate','Rotate themes daily'],['compact','Condensed Canvas cards'],['gradient','Gradient cards'],['hideLogo','Hide Canvas sidebar logo'],['hideFeedback','Hide recent feedback'],['showGrades','Dashboard grades'],['cardLinks','Show card navigation links'],['showGpa','Canvas GPA widget'],['showTodo','Canvas to-do widget'],['showNotes','Course notebook excerpts'],['showAssignments','Course assignment lists'],['assignmentPreview','Assignment preview buttons'],['fullWidth','Full-width Canvas dashboard'],['disableOverlay','Remove course image color overlay'],['showCompanion','Workspace companion'],['showQuote','Workspace quote'],['showAnnouncements','Workspace announcements']];
const mapping={condensed_cards:'compact',gradient_cards:'gradient',remlogo:'hideLogo',hide_feedback:'hideFeedback',dashboard_grades:'showGrades',gpa_calc:'showGpa',better_todo:'showTodo',dashboard_notes:'showNotes',assignments_due:'showAssignments',hover_preview:'assignmentPreview',full_width:'fullWidth',disable_color_overlay:'disableOverlay'};

const hex=v=>typeof v==='string'&&/^#[\da-f]{6}$/i.test(v);
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function imageURL(v){try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function normalizeTheme(input){
 if(!object(input))throw Error('Expected a theme object.');
 const wrapper=input;let data=input.exports??input.theme??input;
 if(typeof data==='string')data=JSON.parse(data);
 if(!object(data))throw Error('Invalid theme data.');
 const legacy='dark_preset' in data||'card_colors' in data||Object.keys(mapping).some(k=>k in data);
 if(!legacy&&(!hex(data.bg)||typeof data.name!=='string'))throw Error('Unrecognized theme format. Export a theme JSON file from BetterCampus or CourseLark.');
 const warnings=[],base=themes[0],settings={};
 const preset=object(data.dark_preset)?data.dark_preset:{};
 const readColor=(v,fallback)=>{if(v===undefined)return fallback;if(!hex(v)){warnings.push('Unsupported color or background replaced with a safe default.');return fallback;}return v;};
 const theme={id:uid(),name:String(wrapper.title||data.name||'Imported campus theme').slice(0,100),bg:readColor(legacy?preset['background-0']:data.bg,base.bg),surface:readColor(legacy?preset['background-1']:data.surface,base.surface),text:readColor(legacy?preset['text-0']:data.text,base.text),accent:readColor(legacy?preset.links:data.accent,base.accent)};
 let palette=legacy?data.card_colors:data.palette;
 if(palette!==undefined&&(!Array.isArray(palette)||palette.some(c=>!hex(c))))throw Error('Invalid card palette. Use six-digit hex colors.');
 theme.sidebar=safeBackground(legacy?preset.sidebar:data.sidebar)||theme.surface;theme.sidebarText=readColor(legacy?preset['sidebar-text']:data.sidebarText,theme.text);
 theme.palette=palette?.length?palette.slice(0,100):[theme.accent];
 const family=legacy?String(data.custom_font?.family||'system-ui').replace(/^['"]|['"]$/g,''):data.font;
 theme.font=fontName(family);if(family&&theme.font!==family)warnings.push('Invalid font name replaced with system font.');
 theme.dark=legacy?(typeof data.dark_mode==='boolean'?data.dark_mode:true):data.dark===true;
 theme.images=[];const images=legacy?data.custom_cards:data.images;
 if(images!==undefined){if(!Array.isArray(images))warnings.push('Per-course image maps are not portable; export card images as a theme.');else for(const img of images.slice(0,100)){if(img==='none'||img===''){theme.images.push('');continue;}const url=imageURL(img);if(url)theme.images.push(url);else warnings.push('An unsafe image URL was omitted.');}}
 for(const [external,local] of Object.entries(mapping)){const value=legacy?data[external]:data.settings?.[local];if(typeof value==='boolean')settings[local]=value;}
 if(!legacy)for(const [key] of displayToggles)if(typeof data.settings?.[key]==='boolean')settings[key]=data.settings[key];
 if(!legacy){if(['light','dark','system','schedule'].includes(data.settings?.mode))settings.mode=data.settings.mode;for(const key of ['darkStart','darkEnd'])if(/^([01]\d|2[0-3]):[0-5]\d$/.test(data.settings?.[key]||''))settings[key]=data.settings[key];}
 const count=legacy?data.num_assignments:data.settings?.assignmentCount;if(count!==undefined&&Number.isInteger(Number(count)))settings.assignmentCount=Math.max(1,Math.min(20,Number(count)));
 if(legacy){if(data.device_dark===true)settings.mode='system';else if(data.auto_dark===true)settings.mode='schedule';
 for(const [external,local] of [['auto_dark_start','darkStart'],['auto_dark_end','darkEnd']]){const t=data[external];if(t&&/^\d{1,2}$/.test(t.hour)&&/^\d{1,2}$/.test(t.minute)&&Number(t.hour)<24&&Number(t.minute)<60)settings[local]=`${String(t.hour).padStart(2,'0')}:${String(t.minute).padStart(2,'0')}`;}
 if(preset.sidebar&&!safeBackground(preset.sidebar))warnings.push('Unsupported sidebar background was replaced.');
 const supported=new Set([...Object.keys(mapping),'dark_preset','card_colors','custom_cards','custom_font','dark_mode','device_dark','auto_dark','auto_dark_start','auto_dark_end','num_assignments']);
 const unsupported=Object.keys(data).filter(k=>!supported.has(k));if(unsupported.length)warnings.push(`Unsupported fields omitted: ${unsupported.slice(0,20).join(', ')}.`);
 }
 theme.settings=settings;
 theme.credits=String(wrapper.credits||data.credits||'').slice(0,120);
 theme.sourceCode=/^[\w-]{1,80}$/.test(wrapper.code||data.sourceCode||'')?wrapper.code||data.sourceCode:'';
 return {theme,warnings:[...new Set(warnings)],format:legacy?'BetterCampus / BetterCanvas':'CourseLark'};
}
export function exportBetterCampus(theme,settings={}){
 const t=normalizeTheme(theme).theme,s={...t.settings,...settings};
 const result={dark_mode:t.dark,dark_preset:{'background-0':t.bg,'background-1':t.surface,'background-2':t.surface,borders:t.accent,'text-0':t.text,'text-1':t.text,'text-2':t.text,links:t.accent,sidebar:t.sidebar,'sidebar-text':t.sidebarText},card_colors:t.palette,custom_cards:t.images.length?t.images:['none'],custom_font:{family:t.font==='system-ui'?'':t.font,link:localFonts.includes(t.font)?'':t.font.replaceAll(' ','+')+':wght@400;700'}};
 for(const [external,local] of Object.entries(mapping))if(typeof s[local]==='boolean')result[external]=s[local];
 result.device_dark=s.mode==='system';result.auto_dark=s.mode==='schedule';
 for(const [external,local] of [['auto_dark_start','darkStart'],['auto_dark_end','darkEnd']])if(/^\d\d:\d\d$/.test(s[local]||'')){const [hour,minute]=s[local].split(':');result[external]={hour,minute};}
 if(Number.isInteger(s.assignmentCount))result.num_assignments=s.assignmentCount;
 return result;
}
export async function communityRequest(code='',fetcher=fetch,options={}){
 if(code&&!/^[\w-]{1,80}$/.test(code))throw Error('Invalid community theme code.');
 const query=new URLSearchParams();if(!code){if(options.search)query.set('search',String(options.search).slice(0,60));if(Number.isInteger(options.page)&&options.page>1)query.set('page',String(options.page));}
 const response=await fetcher('https://api.bettercampus.com/themes'+(code?'/'+encodeURIComponent(code):'')+(query.size?'?'+query:''),{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error(`Community is unavailable (${response.status}). You can still import a theme file.`);
 const raw=await response.text();if(raw.length>5000000)throw Error('Community response is too large.');
 const value=JSON.parse(raw).message;if(code){if(!object(value)||value.code!==code)throw Error('Community returned an invalid theme.');return normalizeTheme(value);}
 if(!Array.isArray(value))throw Error('Community returned an invalid theme list.');
 return value.filter(t=>object(t)&&/^[\w-]{1,80}$/.test(t.code)).slice(0,200).map(t=>({code:t.code,title:String(t.title||'Untitled').slice(0,100),credits:String(t.credits||'').slice(0,120),category:String(t.category||'').slice(0,50)}));
}
