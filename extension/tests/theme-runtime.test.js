import test from 'node:test';
import assert from 'node:assert/strict';
import {fontName,fontCSS,safeBackground} from '../src/theme-runtime.js';
import {normalizeTheme,exportBetterCampus} from '../src/theme-compat.js';
test('preserve community fonts and layered sidebar backgrounds through both export formats',()=>{
 const sidebar='linear-gradient(#5889a7c7, #519a98c7), center url("https://example.com/coast.jpg")';
 const {theme,warnings}=normalizeTheme({dark_preset:{sidebar},custom_font:{family:"'Jost'",link:'Jost:wght@400;700'}});
 assert.equal(theme.font,'Jost');assert.match(theme.sidebar,/coast.jpg/);assert.deepEqual(warnings,[]);
 const restored=normalizeTheme(exportBetterCampus(theme)).theme;assert.equal(restored.font,'Jost');assert.equal(restored.sidebar,theme.sidebar);
 assert.equal(normalizeTheme(theme).theme.sidebar,theme.sidebar);
});
test('background grammar rejects executable URLs, rule injection and unsupported constructs',()=>{
 for(const value of ['url(javascript:alert(1))','url(data:text/html,test)','url("https://user:pass@example.com/a")','red; color:green','url(https://example.com/a)}body{display:none','var(--remote)','linear-gradient(red, blue)','linear-gradient(#fff, url(https://example.com/a))'])assert.equal(safeBackground(value),'',value);
 for(const value of ['#aabbcc','linear-gradient(135deg, #fff 0%, #000 100%)','radial-gradient(circle at center, rgba(1,2,3,0.5), #fff)','url("https://example.com/a.png")'])assert.ok(safeBackground(value),value);
});
test('font identifiers cannot escape their CSS or URL context',()=>{assert.equal(fontName('DM Sans'),'DM Sans');assert.equal(fontCSS('DM Sans'),'"DM Sans", system-ui');for(const bad of ['x; color:red','url(https://example.com/a)','";}',null])assert.equal(fontName(bad),'system-ui');});
