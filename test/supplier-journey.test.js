const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const manifest=require('../data/supplier-programme/localization/manifest.json');
function journey(mode='success'){
  const dom=new JSDOM(fs.readFileSync(path.join(root,'supplier-programme.html'),'utf8'),{url:'https://apply.kananlabs.in/#apply',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,doc=w.document,calls=[];
  w.matchMedia=()=>({matches:true,addEventListener(){}});
  w.fetch=async(url,options)=>{const payload=JSON.parse(options.body);calls.push(payload);return {ok:mode!=='failure',json:async()=>mode==='unconfirmed'?{}:{success:true,applicationId:payload.applicationId}}};
  for(const file of ['supplier-programme-locales.generated.js','supplier-programme.js'])w.eval(fs.readFileSync(path.join(root,'js',file),'utf8'));
  function fill(id,value){const el=doc.getElementById(id);assert.ok(el,id);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}))}
  function click(id){const el=doc.getElementById(id);assert.ok(el,id);el.click()}
  function next(){click('form-next')}
  function company(){fill('companyName','Kanan Internal Test');fill('manufacturingDescription','Castings and machined parts')}
  function contact(){fill('contactName','Internal Test');fill('whatsapp','9840247729');assert.equal(doc.getElementById('consent').checked,false);click('consent')}
  return {dom,w,doc,calls,fill,click,next,company,contact,async settle(){await new Promise(resolve=>setTimeout(resolve,10))}};
}
for(const locale of manifest.locales){
  test(`${locale.localeCode}: ${locale.experience} completes the intended journey`,async()=>{
    const j=journey();try{
      j.fill('language',locale.languageCode);j.next();
      if(locale.experience==='full-form') {j.click('workingCapital-yes');j.click('purposes-invoice_gap');j.next()}
      j.company();j.next();
      if(locale.experience==='full-form'){
        j.fill('state','Tamil Nadu');j.fill('city','Chennai');j.fill('fundingAmountInr','5000000');assert.equal(j.doc.getElementById('fundingAmountInr').value,'₹ 50,00,000');j.next();j.click('orderStatus-no_order');j.next();
      }
      assert.ok(j.doc.querySelector('.sp-boundary-copy').textContent.includes('NBFC'));
      const copy=require('../data/supplier-programme/localization/locales/' + (locale.experience==='full-form'?locale.localeCode:'en-IN') + '.json');
      assert.equal(j.doc.querySelector('.sp-institution-choice').textContent,copy.message.trust_signal_2);
      j.contact();j.next();await j.settle();
      assert.equal(j.calls.length,1);assert.equal(j.calls[0].localeCode,locale.localeCode);assert.equal(j.calls[0].languageExperience,locale.experience);
      assert.equal(j.doc.getElementById('application-result').hidden,false);
    } finally {j.dom.window.close()}
  });
}
test('switching languages and closing a deep link preserve answers without leaving the page',()=>{
  const j=journey();try{
    j.next();j.click('workingCapital-no');j.next();j.company();j.click('form-back');j.click('form-back');j.fill('language','ta');j.next();j.next();
    assert.equal(j.doc.getElementById('companyName').value,'Kanan Internal Test');
    j.doc.querySelector('[data-close-application]').click();assert.equal(j.w.location.pathname,'/');assert.equal(j.w.location.hash,'');
    j.doc.querySelector('[data-open-application]').click();assert.equal(j.doc.getElementById('companyName').value,'Kanan Internal Test');
  }finally{j.dom.window.close()}
});
for(const mode of ['failure','unconfirmed'])test(`${mode}: never shows a false receipt and retains the retry ID`,async()=>{
  const j=journey(mode);try{
    j.next();j.click('workingCapital-no');j.next();j.company();j.next();j.contact();j.next();await j.settle();
    assert.equal(j.doc.getElementById('application-result').hidden,true);assert.equal(j.doc.getElementById('form-error-summary').hidden,false);
    assert.equal(j.doc.getElementById('form-next').disabled,false);j.next();await j.settle();assert.equal(j.calls[0].applicationId,j.calls[1].applicationId);
  }finally{j.dom.window.close()}
});
