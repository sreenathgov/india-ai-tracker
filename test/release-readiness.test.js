const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const {missingConfiguration}=require('../scripts/release/check-environment');

test('Production configuration gate rejects missing careers routing and malformed IDs',()=>{
  const env={BREVO_API_KEY:'test-only',ORIGIN_MAKE_WEBHOOK_URL:'https://example.test/webhook',ORIGIN_MAKE_WEBHOOK_API_KEY:'test-only',CAREERS_NOTIFY_EMAIL:'reviewer@example.test'};
  assert.deepEqual(missingConfiguration(env),['BREVO_CAREERS_LIST_ID']);
  assert.deepEqual(missingConfiguration({...env,BREVO_CAREERS_LIST_ID:'12'}),[]);
  for(const id of ['0','-1','12oops','1.5'])assert.ok(missingConfiguration({...env,BREVO_CAREERS_LIST_ID:id}).includes('BREVO_CAREERS_LIST_ID'));
  assert.ok(missingConfiguration({...env,ORIGIN_MAKE_WEBHOOK_URL:'http://example.test',BREVO_CAREERS_LIST_ID:'12'}).length);
});

test('About matrix exposes complete rows without changing its cells',()=>{
  const dom=new JSDOM(fs.readFileSync('about.html','utf8'));
  try{
    const table=dom.window.document.querySelector('.about-drona__heatmap');
    assert.equal(table.getAttribute('role'),'table');
    assert.equal(table.querySelectorAll(':scope > [role=row]').length,5);
    assert.equal(table.querySelectorAll('[role=cell]').length,16);
    for(const cell of table.querySelectorAll('[role=cell],[role=columnheader],[role=rowheader]')) assert.equal(cell.parentElement.getAttribute('role'),'row');
  }finally{dom.window.close()}
});

function newsletter(fetch){
  const context={window:{},fetch,AbortController,setTimeout,clearTimeout};
  vm.runInNewContext(fs.readFileSync('js/brevo-subscribe.js','utf8'),context);
  return context.window.brevoSubscribe;
}
test('newsletter requires explicit success, not an arbitrary HTTP 200',async()=>{
  for(const body of [{},null,{success:false}]){
    const send=newsletter(async()=>({ok:true,json:async()=>body}));
    await assert.rejects(send('reader@example.test'));
  }
  assert.equal(await newsletter(async()=>({ok:true,json:async()=>({success:true})}))('reader@example.test'),true);
});
test('newsletter recovers when the connection stalls',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const send=newsletter((_url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true})));
  const pending=assert.rejects(send('reader@example.test'),/timed out/);
  t.mock.timers.tick(20000);
  await pending;
});

test('decorative homepage video respects reduced motion and data-saving preferences',()=>{
  const html=fs.readFileSync('index.html','utf8');
  const dom=new JSDOM(html,{runScripts:'outside-only'});
  try {
    const script=[...dom.window.document.scripts].find(el=>el.textContent.includes("getElementById('klHeroVideo')")).textContent;
    for (const preferences of [{reduced:true},{saveData:true},{effectiveType:'2g'},{effectiveType:'slow-2g'},{}]) {
      let sources=0,loads=0,autoplay=true;
      const video={removeAttribute:()=>{autoplay=false},appendChild:()=>{sources++},load:()=>{loads++},readyState:3,play:()=>Promise.resolve()};
      vm.runInNewContext(script,{
        document:{getElementById:()=>video,createElement:()=>({})},
        window:{matchMedia:()=>({matches:!!preferences.reduced})},
        navigator:{connection:preferences},setTimeout
      });
      const blocked=Object.keys(preferences).length>0;
      assert.equal(sources,blocked?0:2);
      assert.equal(loads,blocked?0:1);
      assert.equal(autoplay,!blocked);
    }
    const video=dom.window.document.getElementById('klHeroVideo');
    assert.ok([...dom.window.document.querySelectorAll('link[rel=preload][as=image]')].some(link=>link.getAttribute('href')===video.getAttribute('poster')));
  } finally {dom.window.close()}
});

test('cookie notice remains compact on mobile and withdrawal disables an existing tracker',()=>{
  const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://kananlabs.in/',runScripts:'outside-only'});
  try {
    dom.window.eval(fs.readFileSync('js/consent.js','utf8'));
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    assert.equal(dom.window.document.querySelectorAll('script[src*=googletagmanager]').length,0);
    assert.match(dom.window.document.getElementById('cookie-consent-styles').textContent,/\.cookie-consent__text\{flex:0 1 auto;min-width:0\}/);
    dom.window.document.querySelector('.cookie-consent__btn--accept').click();
    assert.equal(dom.window.document.querySelectorAll('script[src*=googletagmanager]').length,1);
    dom.window.openCookieSettings();
    dom.window.document.querySelector('.cookie-consent__btn--decline').click();
    assert.equal(dom.window['ga-disable-G-EF8EXSDV07'],true);
    assert.equal(dom.window.localStorage.getItem('iat_cookie_consent'),'denied');
    assert.equal(dom.window.document.querySelector('.cookie-consent'),null);
  } finally {dom.window.close()}
});
