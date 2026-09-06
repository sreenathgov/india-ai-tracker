(function () {
  'use strict';

  const LOCALIZATION = window.KANAN_SUPPLIER_LOCALIZATION;
  if (!LOCALIZATION) throw new Error('Supplier Programme localization bundle is unavailable.');

  const LANGUAGE_BY_CODE = new Map(LOCALIZATION.languages.map((language) => [language.languageCode, language]));
  const FULL_LANGUAGE_CODES = new Set(LOCALIZATION.languages.filter((language) => language.experience === 'full-form').map((language) => language.languageCode));
  const ENGLISH_BUNDLE = LOCALIZATION.bundles['en-IN'];
  const LANGUAGES = LOCALIZATION.languages;
  const STATES = ['Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

  const app = document.getElementById('supplier-application');
  const form = document.getElementById('supplier-form');
  const screen = document.getElementById('form-screen');
  const result = document.getElementById('application-result');
  const next = document.getElementById('form-next');
  const back = document.getElementById('form-back');
  const progress = document.getElementById('progress-bar');
  const questionNumber = document.getElementById('question-number');
  const contextTitle = document.getElementById('context-title');
  const contextCopy = document.getElementById('context-copy');
  const errorSummary = document.getElementById('form-error-summary');
  const applicationTitle = document.getElementById('application-title');
  const applicationShell = app.querySelector('.sp-application-shell');
  const applicationProgress = document.getElementById('application-progress');
  const closeButton = app.querySelector('.sp-close');
  const helpTitle = document.getElementById('form-help-title');
  const helpCall = document.getElementById('form-help-call');
  const helpWhatsapp = document.getElementById('form-help-whatsapp');
  let lastFocus = null;
  let submitting = false;
  let state = freshState();
  let sequence = [1,2,3,4,5,6];
  let cursor = 0;
  let completed = false;
  let backgroundState = [];
  function lockBackground(){
    Array.from(document.body.children).filter(el=>el!==app&&!el.contains(app)&&!['SCRIPT','STYLE'].includes(el.tagName)).forEach(el=>{
      if(!backgroundState.some(([saved])=>saved===el))backgroundState.push([el,el.inert]);
      el.inert=true;
    });
  }
  new MutationObserver(()=>{if(!app.hidden)lockBackground()}).observe(document.body,{childList:true});

  function freshState() {
    return {applicationId: makeId(),language:'en',workingCapital:'',purposes:[],companyName:'',manufacturingDescription:'',state:'',city:'',fundingAmountInr:'',orderStatus:'',contactName:'',whatsapp:'',consent:false};
  }
  function makeId(){return 'KSP-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+(crypto.randomUUID?crypto.randomUUID().slice(0,8):Math.random().toString(36).slice(2,10)).toUpperCase()}
  function languageMeta(){return LANGUAGE_BY_CODE.get(state.language) || LANGUAGE_BY_CODE.get('en')}
  function activeBundle(){const meta=languageMeta();return FULL_LANGUAGE_CODES.has(meta.languageCode)?LOCALIZATION.bundles[meta.localeCode]:ENGLISH_BUNDLE}
  function t(){return activeBundle().form}
  function message(){return activeBundle().message}
  function esc(value){return String(value == null ? '' : value).replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function shortFlow(){return !FULL_LANGUAGE_CODES.has(state.language)}
  function syncApplicationLanguage(c){const meta=languageMeta();const renderedLocale=shortFlow()?'en-IN':meta.localeCode;applicationShell.lang=renderedLocale;applicationShell.dir='ltr';applicationShell.dataset.locale=renderedLocale;applicationShell.dataset.preferredLocale=meta.localeCode;applicationTitle.textContent=c.applicationTitle;applicationProgress.setAttribute('aria-label',c.progressLabel);closeButton.setAttribute('aria-label',c.close);helpTitle.textContent=c.help;helpCall.textContent=c.call;helpWhatsapp.textContent=c.whatsapp}
  function setSequence(){sequence=shortFlow()?[1,3,6]:(state.workingCapital==='no'?[1,2,3,6]:[1,2,3,4,5,6]);cursor=Math.max(0,Math.min(cursor,sequence.length-1))}
  function current(){return sequence[cursor]}
  function openApplication(){
    if(!app.hidden)return;
    lastFocus=document.activeElement;
    if(completed){state=freshState();sequence=[1,2,3,4,5,6];cursor=0;completed=false}
    result.hidden=true;form.hidden=false;app.hidden=false;app.setAttribute('aria-hidden','false');
    document.body.classList.add('sp-locked');
    lockBackground();
    if(location.hash!=='#apply')history.pushState({supplierApplication:true},'',location.pathname+location.search+'#apply');
    render();requestAnimationFrame(()=>{const el=screen.querySelector('select,input,button');if(el)el.focus()});
  }
  function closeApplication(fromHistory){
    if(app.hidden||submitting)return;
    app.hidden=true;app.setAttribute('aria-hidden','true');document.body.classList.remove('sp-locked');
    backgroundState.forEach(([el,inert])=>{el.inert=inert});backgroundState=[];
    if(!fromHistory&&location.hash==='#apply'){
      if(history.state&&history.state.supplierApplication)history.back();
      else history.replaceState(history.state,'',location.pathname+location.search);
    }
    if(lastFocus&&lastFocus.focus)lastFocus.focus();
  }
  document.querySelectorAll('[data-open-application]').forEach((el)=>el.addEventListener('click',openApplication));
  document.querySelectorAll('[data-close-application]').forEach((el)=>el.addEventListener('click',()=>closeApplication(false)));
  window.addEventListener('popstate',()=>{if(location.hash==='#apply')openApplication();else closeApplication(true)});
  window.addEventListener('hashchange',()=>{if(location.hash==='#apply')openApplication();else closeApplication(true)});
  if(location.hash==='#apply')openApplication();

  function radio(name,value,label,checked){return `<div class="sp-choice"><input type="radio" id="${name}-${value}" name="${name}" value="${value}" ${checked?'checked':''}><label for="${name}-${value}">${esc(label)}</label></div>`}
  function check(name,value,label,checked){return `<div class="sp-choice"><input type="checkbox" id="${name}-${value}" name="${name}" value="${value}" ${checked?'checked':''}><label for="${name}-${value}">${esc(label)}</label></div>`}
  function render(){
    setSequence();
    const c=t(),step=current(),displayIndex=cursor+1;
    syncApplicationLanguage(c);
    questionNumber.textContent=String(displayIndex).padStart(2,'0')+' / '+String(sequence.length).padStart(2,'0');
    progress.style.width=(displayIndex/sequence.length*100)+'%';
    applicationProgress.setAttribute('aria-valuenow',String(displayIndex));
    applicationProgress.setAttribute('aria-valuemax',String(sequence.length));
    back.textContent=c.back;
    back.hidden=cursor===0;
    next.firstChild.textContent=(cursor===sequence.length-1?c.submit:c.next)+' ';
    next.disabled=false;
    errorSummary.hidden=true;
    const ctx=c.ctx[step-1]||ENGLISH_BUNDLE.form.ctx[step-1];
    contextTitle.textContent=ctx[0];
    contextCopy.textContent=ctx[1];
    contextCopy.hidden=!ctx[1];
    // Start each new question at its heading, preserving scroll within a question.
    if(screen.dataset.step!==String(step)){
      screen.dataset.step=String(step);
      screen.closest('.sp-form-panel').scrollTop=0;
    }
    screen.innerHTML=renderStep(step,c,message());
    bindInputs();
  }
  function renderStep(step,c,m){
    if(step===1){
      return `<h3>${esc(c.titles[0])}</h3><div class="sp-field"><label for="language">Language / भाषा</label><select id="language" name="language">${LANGUAGES.map((language)=>{const names=language.languageNameNative===language.languageNameEnglish?language.languageNameNative:`${language.languageNameNative} — ${language.languageNameEnglish}`;const suffix=language.experience==='full-form'?'':` · ${c.contactOnly}`;return `<option lang="${esc(language.localeCode)}" value="${esc(language.languageCode)}" ${state.language===language.languageCode?'selected':''}>${esc(names+suffix)}</option>`}).join('')}</select><small>${esc(shortFlow()?c.shortHelp:c.availability)}</small></div>`;
    }
    if(step===2){
      return `<h3>${esc(c.titles[1])}</h3><div class="sp-choice-grid">${radio('workingCapital','yes',c.yes,state.workingCapital==='yes')}${radio('workingCapital','no',c.no,state.workingCapital==='no')}</div>${state.workingCapital==='yes'?`<fieldset class="sp-field"><legend>${esc(c.purpose)}</legend><div class="sp-choice-grid">${check('purposes','cc_od',c.ccod,state.purposes.includes('cc_od'))}${check('purposes','raw_materials',c.raw,state.purposes.includes('raw_materials'))}${check('purposes','production_costs',c.production,state.purposes.includes('production_costs'))}${check('purposes','confirmed_order',c.order,state.purposes.includes('confirmed_order'))}${check('purposes','invoice_gap',c.invoice,state.purposes.includes('invoice_gap'))}${check('purposes','other',c.other,state.purposes.includes('other'))}</div><p class="sp-programme-note">${esc(c.machineryNote)}</p></fieldset>`:''}`;
    }
    if(step===3){
      return `<h3>${esc(shortFlow()?c.shortTitle:c.titles[2])}</h3>${shortFlow()?`<p>${esc(c.shortHelp)}</p>`:''}<div class="sp-field"><label for="companyName">${esc(c.company)}</label><input id="companyName" name="companyName" maxlength="160" autocomplete="organization" value="${esc(state.companyName)}"></div><div class="sp-field"><label for="manufacturingDescription">${esc(c.manufacture)}</label><textarea id="manufacturingDescription" name="manufacturingDescription" maxlength="500" placeholder="${esc(c.manufactureHint)}">${esc(state.manufacturingDescription)}</textarea></div>`;
    }
    if(step===4){
      return `<h3>${esc(c.titles[3])}</h3><div class="sp-two-cols"><div class="sp-field"><label for="state">${esc(c.state)}</label><select id="state" name="state"><option value="">${esc(c.choose)}</option>${STATES.map((item)=>`<option ${state.state===item?'selected':''}>${esc(item)}</option>`).join('')}</select></div><div class="sp-field"><label for="city">${esc(c.city)}</label><input id="city" name="city" maxlength="120" autocomplete="address-level2" value="${esc(state.city)}"></div></div><div class="sp-field"><label for="fundingAmountInr">${esc(c.amount)}</label><input id="fundingAmountInr" name="fundingAmountInr" inputmode="numeric" autocomplete="off" placeholder="₹ 50,00,000" value="${esc(formatAmount(state.fundingAmountInr))}"><small>${esc(c.amountHint)}</small><div class="sp-shortcuts"><button type="button" data-amount="2500000">₹25 lakh</button><button type="button" data-amount="5000000">₹50 lakh</button><button type="button" data-amount="10000000">₹1 crore</button><button type="button" data-amount="20000000">₹2 crore+</button></div></div>`;
    }
    if(step===5){
      return `<h3>${esc(c.titles[4])}</h3><fieldset class="sp-field"><legend>${esc(c.demand)}</legend><div class="sp-choice-grid">${radio('orderStatus','confirmed_po',c.po,state.orderStatus==='confirmed_po')}${radio('orderStatus','customer_release',c.release,state.orderStatus==='customer_release')}${radio('orderStatus','forecast',c.forecast,state.orderStatus==='forecast')}${radio('orderStatus','no_order',c.none,state.orderStatus==='no_order')}${radio('orderStatus','not_sure',c.unsure,state.orderStatus==='not_sure')}</div></fieldset><aside class="sp-programme-note"><strong>${esc(m.risk_diagnostic_title)}</strong><span>${esc(m.risk_diagnostic_body)}</span><span>${esc(m.risk_scope_note)}</span><span>${esc(c.selectedReview)}</span></aside>`;
    }
    return `<h3>${esc(c.titles[5])}</h3><div class="sp-field"><label for="contactName">${esc(c.name)}</label><input id="contactName" name="contactName" maxlength="120" autocomplete="name" value="${esc(state.contactName)}"></div><div class="sp-field"><label for="whatsapp">${esc(c.phone)}</label><input id="whatsapp" name="whatsapp" inputmode="tel" autocomplete="tel" placeholder="+91 98402 47729" value="${esc(state.whatsapp)}"><small>${esc(c.phoneHint)}</small></div><aside class="sp-boundary-note"><p class="sp-boundary-copy">${esc(m.lender_boundary_copy)}</p><p class="sp-institution-choice">${esc(m.trust_signal_2)}</p><p>${esc(m.privacy_microcopy)}</p></aside><div class="sp-consent"><input id="consent" name="consent" type="checkbox" ${state.consent?'checked':''}><label for="consent">${esc(c.consent)} <a href="/privacy-policy.html" target="_blank" rel="noopener">${esc(c.privacy)}</a> · <a href="/supplier-programme-terms.html" target="_blank" rel="noopener">${esc(c.terms)}</a></label></div>`;
  }
  function bindInputs(){screen.querySelectorAll('input,select,textarea').forEach((el)=>{el.addEventListener('input',capture);el.addEventListener('change',(event)=>{capture(event);if(el.name==='language'){setSequence();render()}if(el.name==='workingCapital'){setSequence();render()}})});screen.querySelectorAll('[data-amount]').forEach((el)=>el.addEventListener('click',()=>{state.fundingAmountInr=el.dataset.amount;render()}))}
  function capture(event){const el=event.target;if(el.name==='purposes'){state.purposes=Array.from(screen.querySelectorAll('[name="purposes"]:checked')).map((n)=>n.value);return}if(el.name==='consent'){state.consent=el.checked;return}if(el.name==='fundingAmountInr'){state.fundingAmountInr=el.value.replace(/\D/g,'');el.value=formatAmount(state.fundingAmountInr);return}if(el.name in state)state[el.name]=el.value}
  function formatAmount(v){const digits=String(v||'').replace(/\D/g,'');if(!digits)return '';return '₹ '+Number(digits).toLocaleString('en-IN')}
  function validPhone(v){const digits=String(v||'').replace(/\D/g,'');const local=digits.length===12&&digits.startsWith('91')?digits.slice(2):digits;return /^[6-9]\d{9}$/.test(local)}
  function validate(){const c=t(),step=current();let ok=true;if(step===1&&!state.language)ok=false;if(step===2&&(!state.workingCapital||(state.workingCapital==='yes'&&!state.purposes.length)))ok=false;if(step===3&&(!state.companyName.trim()||!state.manufacturingDescription.trim()))ok=false;if(step===4&&(!state.state||!state.city.trim()||!Number(state.fundingAmountInr)))ok=false;if(step===5&&!state.orderStatus)ok=false;if(step===6){if(!state.contactName.trim()||!state.consent)ok=false;if(!validPhone(state.whatsapp)){ok=false;errorSummary.textContent=c.invalidPhone}else errorSummary.textContent=c.required}else errorSummary.textContent=c.required;errorSummary.hidden=ok;if(!ok){const target=screen.querySelector('input:not([type="hidden"]),select,textarea');if(target)target.focus()}return ok}
  function normalizePhone(v){let digits=String(v||'').replace(/\D/g,'');if(digits.length===10)digits='91'+digits;return '+'+digits}
  back.addEventListener('click',()=>{if(cursor>0){cursor-=1;render()}});
  next.addEventListener('click',async()=>{if(submitting||!validate())return;if(cursor<sequence.length-1){cursor+=1;render();requestAnimationFrame(()=>{const el=screen.querySelector('input,select,textarea');if(el)el.focus({preventScroll:true})});return}await submit()});
  form.addEventListener('submit',(event)=>{event.preventDefault();next.click()});
  async function submit(){
    submitting=true;
    back.disabled=true;
    closeButton.disabled=true;
    next.disabled=true;
    next.firstChild.textContent=t().sending+' ';
    const params=new URLSearchParams(location.search);
    const meta=languageMeta();
    const payload={
      ...state,
      localeCode:meta.localeCode,
      languageExperience:shortFlow()?'contact-flow':'full-form',
      localizationVersion:LOCALIZATION.localizationVersion,
      whatsapp:normalizePhone(state.whatsapp),
      fundingAmountInr:state.workingCapital==='yes'?Number(state.fundingAmountInr):null,
      orderStatus:state.workingCapital==='yes'?state.orderStatus:null,
      consentVersion:'supplier-programme-2026-09-v2',
      schemaVersion:'supplier-programme.v2',
      source:{
        referrer:document.referrer||'',
        utm_source:params.get('utm_source')||'',
        utm_medium:params.get('utm_medium')||'',
        utm_campaign:params.get('utm_campaign')||'',
        utm_content:params.get('utm_content')||''
      },
      company_website:form.elements.company_website.value
    };
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),20000);
    try{
      const response=await fetch('/api/supplier-programme',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      if(!response.ok)throw new Error('submission_failed');
      const data=await response.json();
      if(data.success!==true||data.applicationId!==state.applicationId)throw new Error('unconfirmed_receipt');
      showSuccess(data.applicationId);
    }catch(_){
      errorSummary.textContent=t().failure;
      errorSummary.hidden=false;
      next.disabled=false;
      next.firstChild.textContent=t().submit+' ';
    }finally{clearTimeout(timeout);submitting=false;back.disabled=false;closeButton.disabled=false}
  }
  function showSuccess(applicationId){
    completed=true;
    const c=t(),m=message();
    form.hidden=true;
    result.hidden=false;
    result.setAttribute('tabindex','-1');
    let title=c.received,body=c.receivedBody;
    if(shortFlow()){title=c.languageReceived;body=c.languageBody}
    else if(state.workingCapital==='no'){title=c.otherReceived;body=c.otherBody}
    result.innerHTML=`<p class="sp-result-id">${esc(c.reference)} · ${esc(applicationId)}</p><h2>${esc(title)}</h2><p class="sp-receipt-boundary">${esc(m.submission_confirmation)}</p><p>${esc(body)}</p><div class="sp-result-actions"><a href="tel:+919840247729">${esc(c.call)}</a><a href="https://wa.me/919840247729?text=Hello%20Kanan%20Labs%2C%20my%20application%20reference%20is%20${encodeURIComponent(applicationId)}.">${esc(c.whatsapp)}</a></div>`;
    result.focus();
  }
  app.addEventListener('keydown',(event)=>{if(event.key==='Escape'){event.preventDefault();closeApplication(false);return}if(event.key!=='Tab')return;const focusable=Array.from(app.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])')).filter((el)=>el.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});

  function initRiskMotion(){
    const riskMap=document.querySelector('[data-risk-motion]');
    if(!riskMap)return;
    const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData=navigator.connection&&navigator.connection.saveData;
    if(reduceMotion||saveData)return;
    riskMap.classList.add('is-ready');
    const play=()=>requestAnimationFrame(()=>riskMap.classList.add('is-running'));
    if(!('IntersectionObserver' in window)){play();return}
    const observer=new IntersectionObserver((entries)=>{
      if(!entries.some((entry)=>entry.isIntersecting&&entry.intersectionRatio>=.35))return;
      play();
      observer.disconnect();
    },{threshold:[.35]});
    observer.observe(riskMap);
  }

  initRiskMotion();
})();
