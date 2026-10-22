// Shared theme grammar: produce CSS values from supported data, never arbitrary rules.
export const localFonts=['system-ui','Georgia','Arial','Verdana','monospace'];
export function fontName(value){return typeof value==='string'&&/^[A-Za-z][A-Za-z0-9 -]{0,79}$/.test(value.trim())?value.trim():'system-ui';}
export function fontCSS(value){const name=fontName(value);return localFonts.includes(name)?name:JSON.stringify(name)+', system-ui';}
export function applyFont(doc,value){
 const name=fontName(value);let link=doc.getElementById('open-campus-font');
 if(localFonts.includes(name)){link?.remove();return fontCSS(name);}
 const href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(name)+':wght@400;700&display=swap';
 if(link?.href===href)return fontCSS(name);
 link?.remove();link=doc.createElement('link');link.id='open-campus-font';link.rel='stylesheet';link.referrerPolicy='no-referrer';link.href=href;link.dataset.status='loading';link.onload=()=>link.dataset.status='loaded';link.onerror=()=>link.dataset.status='unavailable';doc.head.append(link);return fontCSS(name);
}
function layers(value){let depth=0,quote='',start=0,result=[];for(let i=0;i<value.length;i++){const ch=value[i];if(quote){if(ch===quote&&value[i-1]!=='\\')quote='';continue;}if(ch==='"'||ch==="'"){quote=ch;continue;}if(ch==='(')depth++;if(ch===')'&&--depth<0)return null;if(ch===','&&depth===0){result.push(value.slice(start,i).trim());start=i+1;}}if(depth||quote)return null;result.push(value.slice(start).trim());return result;}
const colorStop=/^(?:#[\da-f]{3,8}|transparent|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\))(?:\s+-?[\d.]+(?:%|px))?$/i;
export function safeBackground(value){
 if(typeof value!=='string'||value.length>10000||/[{};<>\\\r\n]/.test(value))return '';
 if(/^#[\da-f]{3,8}$/i.test(value.trim()))return value.trim();
 const parts=layers(value);if(!parts||parts.length>8)return '';
 const clean=[];
 for(const part of parts){
  const gradient=part.match(/^((?:repeating-)?(?:linear|radial)-gradient)\((.*)\)$/i);
  if(gradient){const stops=layers(gradient[2]);if(!stops)return '';if(/^(?:-?[\d.]+(?:deg|turn|rad)|to (?:top|bottom|left|right)(?: (?:left|right))?|(?:circle|ellipse)(?: at (?:center|top|bottom|left|right|[\d.]+%)(?: (?:center|top|bottom|left|right|[\d.]+%))?)?)$/i.test(stops[0]))stops.shift();if(stops.length<2||stops.some(x=>!colorStop.test(x)))return '';clean.push(part);continue;}
  const image=part.match(/^(?:(center|top|bottom|left|right)\s+)?url\(\s*(?:"([^"\n]*)"|'([^'\n]*)'|([^\s()"']+))\s*\)(?:\s+(center|top|bottom|left|right))?(?:\s*\/\s*(cover|contain))?$/i);
  if(!image)return '';try{const url=new URL(image[2]??image[3]??image[4]);if(url.protocol!=='https:'||url.username||url.password)return '';clean.push(`url(${JSON.stringify(url.href)}) ${image[1]||image[5]||'center'} / ${image[6]||'cover'}`);}catch{return '';}
 }
 return clean.join(', ');
}
