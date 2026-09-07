const test = require('node:test');
const assert = require('node:assert/strict');
const { motionState, createController } = require('../js/homepage-motion');

test('user pause and reduced motion take precedence over visibility', () => {
    assert.equal(motionState({reduced:false,paused:false,visible:true,hidden:false}), 'running');
    assert.equal(motionState({reduced:false,paused:false,visible:false,hidden:false}), 'suspended');
    assert.equal(motionState({reduced:false,paused:false,visible:true,hidden:true}), 'suspended');
    assert.equal(motionState({reduced:false,paused:true,visible:true,hidden:false}), 'paused');
    assert.equal(motionState({reduced:true,paused:true,visible:true,hidden:false}), 'static');
});

function boot(withButton = true) {
    const events = {}, mediaEvents = {}, buttonEvents = {}, calls = [];
    let intersect;
    const preference = {matches:false,addEventListener:(name,fn) => mediaEvents[name] = fn};
    const doc = {hidden:false,addEventListener:(name,fn) => events[name] = fn};
    const win = {matchMedia:() => preference,IntersectionObserver:class {
        constructor(fn) { intersect = fn; } observe() {}
    }};
    const element = {dataset:{}};
    const button = {hidden:true,textContent:'Pause animation',attrs:{},setAttribute(name,value) { this.attrs[name]=value; },
        addEventListener:(name,fn) => buttonEvents[name] = fn};
    const controller = createController(win,doc);
    const handle = controller.register({element,button:withButton ? button : undefined,label:'workflow',resume:() => calls.push('resume'),
        pause:() => calls.push('pause'),static:() => calls.push('static')});
    return {handle,button,calls,visible(value) { intersect([{target:element,isIntersecting:value}]); },
        hidden(value) { doc.hidden=value; events.visibilitychange(); },
        reduced(value) { preference.matches=value; mediaEvents.change(); },click() { buttonEvents.click(); }};
}

test('scroll and tab visibility cannot resume an explicitly paused animation', () => {
    const state=boot();
    state.visible(true); state.click();
    assert.equal(state.handle.state,'paused');
    state.visible(false); state.hidden(true); state.hidden(false); state.visible(true);
    assert.equal(state.handle.state,'paused');
    assert.deepEqual(state.calls,['pause','resume','pause']);
    state.click();
    assert.equal(state.handle.state,'running');
    assert.equal(state.button.textContent,'Pause animation');
});

test('reduced motion resolves the visual and preserves the prior user pause on restoration', () => {
    const state=boot(); state.visible(true); state.click(); state.reduced(true);
    assert.equal(state.button.hidden,true);
    assert.equal(state.handle.state,'static');
    state.reduced(false);
    assert.equal(state.button.hidden,false);
    assert.equal(state.handle.state,'paused');
    assert.equal(state.button.attrs['aria-pressed'],'true');
    assert.match(state.button.attrs['aria-label'],/^Resume animation: workflow$/);
});

test('visibility resumes from suspension once and autoplay rejection becomes a user retry', () => {
    const state=boot(); state.visible(true); state.visible(true);
    assert.equal(state.calls.filter(call=>call==='resume').length,1);
    state.handle.setPaused(true);
    state.click();
    assert.equal(state.handle.state,'running');
    state.hidden(true); state.hidden(false);
    assert.deepEqual(state.calls.slice(-2),['pause','resume']);
});

test('effects without visible controls still suspend and honour reduced motion', () => {
    const state = boot(false);
    state.visible(true);
    assert.equal(state.handle.state, 'running');
    state.hidden(true);
    assert.equal(state.handle.state, 'suspended');
    state.hidden(false);
    state.reduced(true);
    assert.equal(state.handle.state, 'static');
    state.reduced(false);
    assert.equal(state.handle.state, 'running');
});
