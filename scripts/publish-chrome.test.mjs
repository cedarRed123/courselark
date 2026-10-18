import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publish} from './publish-chrome.mjs';
const revision = (state, version) => ({state, distributionChannels:[{crxVersion:version}]});
async function run(responses) {
  const calls=[];
  await publish({token:'test-token',publisher:'publisher',item:'item',version:'0.3.2.1',archive:new URL('../extension/manifest.json',import.meta.url),sleep:async()=>{},request:async(url,options)=>{
    calls.push({url,options});
    const response=responses.shift();
    assert.ok(response, 'Unexpected API request');
    return {ok:true,json:async()=>response};
  }});
  return calls;
}
test('waits for upload before submitting',async()=>{
  const calls=await run([{}, {uploadState:'IN_PROGRESS'}, {lastAsyncUploadState:'SUCCEEDED'}, {state:'PENDING_REVIEW'}]);
  assert.equal(calls.length,4);
  assert.match(calls[1].url,/\/upload\/v2\//);
  assert.match(calls[2].url,/:fetchStatus$/);
  assert.equal(JSON.parse(calls[3].options.body).publishType,'DEFAULT_PUBLISH');
});
test('does not submit a failed upload',async()=>{
  await assert.rejects(run([{}, {uploadState:'FAILED'}]),/did not succeed/);
});
test('rerun skips a version already in review',async()=>{
  assert.equal((await run([{submittedItemRevisionStatus:revision('PENDING_REVIEW','0.3.2.1')}])).length,1);
});
test('preserves an earlier review',async()=>{
  await assert.rejects(run([{submittedItemRevisionStatus:revision('PENDING_REVIEW','0.3.2')}]),/earlier version/);
});
test('rejects a stale rerun',async()=>{
  await assert.rejects(run([{publishedItemRevisionStatus:revision('PUBLISHED','0.3.2.2')}]),/older version/);
});
test('rejects unexpected publication state',async()=>{
  await assert.rejects(run([{}, {uploadState:'SUCCEEDED'}, {state:'REJECTED'}]),/Unexpected publishing state/);
});
