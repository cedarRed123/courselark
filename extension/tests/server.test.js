import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const mock=http.createServer(async(req,res)=>{let data='';for await(const c of req)data+=c;const request=JSON.parse(data);assert.equal(request.stream,false);assert.match(request.messages[1].content,/SOURCE MATERIAL/);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({message:{content:'Local test answer'}}));});mock.listen(0,'127.0.0.1');await once(mock,'listening');const reserve=http.createServer();reserve.listen(0,'127.0.0.1');await once(reserve,'listening');const port=reserve.address().port;await new Promise(r=>reserve.close(r));
const token='a'.repeat(64);
const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,CAMPUS_PORT:String(port),CAMPUS_OLLAMA_PORT:String(mock.address().port),CAMPUS_PAIRING_TOKEN:token,WHISPER_COMMAND:'',WHISPER_MODEL:'',TESSERACT_COMMAND:new URL('./fake-tesseract.mjs',import.meta.url).pathname},stdio:['ignore','pipe','pipe']});await once(server.stdout,'data');const base=`http://127.0.0.1:${port}`;
test.after(async()=>{server.kill();await once(server,'exit');await new Promise(r=>mock.close(r));});
test('local companion serves module assets and rejects foreign origins/hosts',async()=>{assert.equal((await fetch(base+'/src/app.js')).status,200);assert.equal((await fetch(base+'/src/app.js',{headers:{Origin:'https://untrusted.example'}})).status,403);const hostStatus=await new Promise((resolve,reject)=>{const req=http.get(base+'/src/app.js',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});assert.equal(hostStatus,403);assert.equal((await fetch(base+'/package.json')).status,404);});
test('local AI proxy requires pairing before processing notes',async()=>{const unpaired=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:'chrome-extension://'+'a'.repeat(32)},body:JSON.stringify({model:'mock',prompt:'Question',context:'Notes'})});assert.equal(unpaired.status,401);const res=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:'chrome-extension://'+'a'.repeat(32),Authorization:'Bearer '+token},body:JSON.stringify({model:'mock',prompt:'Question',context:'Notes'})});assert.equal(res.status,200);assert.equal(res.headers.get('access-control-allow-origin'),'chrome-extension://'+'a'.repeat(32));assert.equal((await res.json()).text,'Local test answer');});
test('unconfigured transcription reports the missing local engine after pairing',async()=>{const unpaired=await fetch(base+'/api/transcribe',{method:'POST',body:'audio'});assert.equal(unpaired.status,401);const res=await fetch(base+'/api/transcribe',{method:'POST',headers:{Authorization:'Bearer '+token},body:'audio'});assert.equal(res.status,500);assert.match((await res.json()).error,/WHISPER_COMMAND/);});

test('local OCR requires pairing, accepts only page images, and passes a safe language code',async()=>{
 assert.equal((await fetch(base+'/api/ocr',{method:'POST',headers:{'Content-Type':'image/png'},body:'x'})).status,401);
 const auth={Authorization:'Bearer '+token};
 const wrong=await fetch(base+'/api/ocr',{method:'POST',headers:{...auth,'Content-Type':'text/plain'},body:'x'});assert.equal(wrong.status,500);assert.match((await wrong.json()).error,/PNG or JPEG/);
 const ok=await fetch(base+'/api/ocr?lang=spa%2Beng',{method:'POST',headers:{...auth,'Content-Type':'image/png'},body:'12345'});assert.equal(ok.status,200);assert.equal((await ok.json()).text,'OCR spa+eng 5 bytes');
 const unsafe=await fetch(base+'/api/ocr?lang=--psm%209',{method:'POST',headers:{...auth,'Content-Type':'image/png'},body:'1'});assert.equal((await unsafe.json()).text,'OCR eng 1 bytes');
});
