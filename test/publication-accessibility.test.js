const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

test('publication layers focus their controls, isolate the background and restore keyboard position',()=>{
  const dom=new JSDOM('<!doctype html><html><body><header><button id="menu">Menu</button></header><main><article id="article"><button id="trigger">Details</button></article><aside id="analysisPanel" inert><button class="panel-close">Close</button><h2 id="analysisPanelTitle"></h2><div id="analysisPanelContent"></div></aside><aside id="indepthPanel" inert><button class="panel-close">Close</button><h2 id="indepthPanelTitle"></h2><div id="indepthPanelContent"></div></aside></main><footer></footer></body></html>',{url:'https://kananlabs.in/publications/example/',runScripts:'outside-only',pretendToBeVisual:true});
  try{
    const w=dom.window,d=w.document;
    const add=d.addEventListener.bind(d);
    d.addEventListener=(type,fn,...rest)=>{if(type!=='DOMContentLoaded')add(type,fn,...rest)};
    w.matchMedia=()=>({matches:true,addEventListener(){}});
    w.requestAnimationFrame=fn=>fn();
    w.eval(fs.readFileSync('js/publications.js','utf8') + `
      analysisPanel=document.getElementById('analysisPanel');
      analysisPanelTitle=document.getElementById('analysisPanelTitle');
      analysisPanelContent=document.getElementById('analysisPanelContent');
      indepthPanel=document.getElementById('indepthPanel');
      indepthPanelTitle=document.getElementById('indepthPanelTitle');
      indepthPanelContent=document.getElementById('indepthPanelContent');
      publicationData={chapters:[{sections:[{title:'Analysis',content:'<p>Evidence</p>',subsections:[{title:'Note',content:'<p>Details</p>'}]}]}]};
      clearActiveCards=lockScroll=unlockScroll=addBackdrop=removeBackdrop=updateLayerIndicator=updateURL=()=>{};
      setupKeyboardNavigation();
    `);
    const trigger=d.getElementById('trigger'),analysis=d.getElementById('analysisPanel'),depth=d.getElementById('indepthPanel');
    trigger.focus();w.openAnalysisPanel(0,0);
    assert.equal(d.activeElement,analysis.querySelector('.panel-close'));
    assert.equal(analysis.getAttribute('aria-hidden'),'false');
    assert.equal(d.getElementById('article').inert,true);
    const note=analysis.querySelector('.subsection-link');note.focus();w.openIndepthPanel(0,0,0);
    assert.equal(d.activeElement,depth.querySelector('.panel-close'));
    assert.equal(analysis.inert,true);
    d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    assert.equal(d.activeElement,note);assert.equal(analysis.inert,false);
    d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    assert.equal(d.activeElement,trigger);assert.notEqual(d.getElementById('article').inert,true);
    assert.equal(analysis.getAttribute('aria-hidden'),'true');assert.equal(depth.getAttribute('aria-hidden'),'true');
  }finally{dom.window.close()}
});
