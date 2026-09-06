const test = require('node:test');
const assert = require('node:assert/strict');
const {isAllowedOrigin, applyCors, validateRequest} = require('../api/_lib/security');
const {sheetText, sheetRecord, validateApplication} = require('../api/_lib/supplier-programme');
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v},status(v){this.code=v;return this},json(v){this.body=v;return this}}}
test('CORS rejects unrelated Vercel projects and lookalike domains',()=>{
  assert.equal(isAllowedOrigin('https://unrelated-attacker.vercel.app'),false);
  assert.equal(isAllowedOrigin('https://kananlabs.in.attacker.test'),false);
  assert.equal(isAllowedOrigin('https://apply.kananlabs.in'),true);
  const original=process.env.VERCEL_URL;process.env.VERCEL_URL='kanan-fixture.vercel.app';
  try{assert.equal(isAllowedOrigin('https://kanan-fixture.vercel.app'),true)}finally{if(original===undefined)delete process.env.VERCEL_URL;else process.env.VERCEL_URL=original}
});
test('all API responses including blocked origins are non-cacheable',()=>{
  const res=response();assert.equal(applyCors({headers:{origin:'https://attacker.test'}},res),false);
  assert.equal(res.headers['Cache-Control'],'no-store');
});
test('request guard rejects oversized, non-JSON and non-object submissions',()=>{
  for(const [body,headers,code] of [[[],{},400],[{text:'x'.repeat(17000)},{},413],[{ok:true},{'content-type':'text/plain'},415]]){
    const res=response();assert.equal(validateRequest({body,headers},res),false);assert.equal(res.code,code);
  }
});
test('spreadsheet formula injection is neutralized without changing normal Indic text',()=>{
  for(const value of ['=1+1','+SUM(A1)','-1+2','@cmd','  =HYPERLINK("https://example.test")']) assert.equal(sheetText(value),"'"+value);
  for(const value of ['मशीनिंग','Tamil Casting Pvt Ltd','PO-0123','₹ 50,00,000']) assert.equal(sheetText(value),value);
  const record={companyName:'=1+1',contactName:'@example',source:{utmSource:'=2+2'},whatsapp:'+919840247729'};
  const safe=sheetRecord(record);assert.equal(safe.companyName,"'=1+1");assert.equal(record.companyName,'=1+1');assert.equal(safe.source.utmSource,"'=2+2");
});
test('unknown schema versions cannot fall through as an older approved client',()=>{
  assert.ok(validateApplication({schemaVersion:'supplier-programme.v99'}).errors.includes('schemaVersion'));
});
