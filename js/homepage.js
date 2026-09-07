/* Homepage-only composition and interactions. Content is authored in HTML;
   animation is an enhancement, never the source of readable information. */
(function () {
    'use strict';
    if (!document.body.classList.contains('kl-homepage')) return;
    const compact = matchMedia('(max-width: 1023px)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const gsap = window.gsap;
    const motion = window.KananHomepageMotion.createController(window, document);
    const $ = selector => document.querySelector(selector);
    const $$ = selector => Array.from(document.querySelectorAll(selector));
    const cleanup = [];
    function register(id, element, callbacks) {
        if (element) return motion.register({ element, label: id.replaceAll('-', ' '), ...callbacks });
    }
    function refreshLayout() {
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }

    function initMenu() {
        const toggle = $('.sm-toggle');
        const panel = $('.staggered-menu-panel');
        if (!gsap || !toggle || !panel) {
            if (!gsap) {
                const partialMenu = $('.staggered-menu-wrapper');
                if (partialMenu) partialMenu.hidden = true;
                const nav = document.createElement('nav');
                nav.className = 'kl-homepage-fallback'; nav.setAttribute('aria-label','Main navigation');
                [['Kanan Labs','index.html'],['Drona','drona.html'],['Supplier Programme','https://apply.kananlabs.in/'],
                    ['India AI Tracker','tracker.html'],['DronaAOS','drona-aos.html'],['Resources','resources.html'],
                    ['About','about.html'],['Careers','careers.html']].forEach(([label,href]) => {
                    const link = document.createElement('a'); link.textContent = label; link.href = href; nav.append(link);
                });
                document.body.prepend(nav);
            }
            return;
        }
        const content = $('.page-wrapper');
        function sync() {
            const open = toggle.getAttribute('aria-expanded') === 'true';
            content.inert = open; panel.inert = !open;
        }
        new MutationObserver(sync).observe(toggle,{attributes:true,attributeFilter:['aria-expanded']});
        sync();
        document.addEventListener('keydown',event => {
            if (toggle.getAttribute('aria-expanded') !== 'true') return;
            if (event.key === 'Escape') { event.preventDefault(); toggle.click(); toggle.focus(); }
            if (event.key === 'Tab') {
                const targets = [toggle,...Array.from(panel.querySelectorAll('a[href]'))];
                const first = targets[0], last = targets[targets.length-1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        });
        toggle.addEventListener('focus',() => {
            // Keyboard focus must never land on a header hidden by scrolling.
            if (gsap) gsap.set(toggle.closest('.staggered-menu-header'),{y:0,opacity:1});
        });
    }

    function initVideo() {
        const video = $('#klHeroVideo');
        const connection = navigator.connection;
        if (connection && (connection.saveData || /^(?:slow-)?2g$/.test(connection.effectiveType))) return;
        let desired = false;
        let effect;
        function play() {
            desired = true;
            const request = video.play();
            if (request) request.then(() => { if (!desired) video.pause(); }).catch(() => {
                // Autoplay may be unavailable; retain the native poster.
                if (effect) effect.setPaused(true);
            });
        }
        function pause() { desired = false; video.pause(); }
        effect = register('hero', $('.kl-hero'), { resume: play, pause, static: pause });
    }

    function initWorkflow() {
        const workflow = $('[data-origin-workflow]');
        let running = false, timer = 0, remaining = 13000, started = 0, active = false;
        function pause() {
            if (running) remaining = Math.max(0, remaining - (performance.now() - started));
            running = false;
            clearTimeout(timer);
            workflow.classList.add('is-paused');
        }
        function resume() {
            if (!active || remaining <= 0) {
                workflow.classList.remove('is-running');
                // One restart per 13-second cycle; not repeated on scroll.
                void workflow.offsetWidth;
                workflow.classList.add('is-animated', 'is-running');
                active = true;
                remaining = 13000;
            }
            workflow.classList.remove('is-paused');
            running = true;
            started = performance.now();
            clearTimeout(timer);
            timer = setTimeout(() => { remaining = 0; resume(); }, remaining);
        }
        register('workflow', workflow, { resume, pause, static() {
            pause(); active = false; remaining = 13000;
            workflow.classList.remove('is-animated', 'is-running', 'is-paused');
        } });
    }

    function initAudience() {
        const section = $('#klDrona');
        const stage = section.querySelector('.kl-drona__stage');
        const buttons = Array.from(section.querySelectorAll('.kl-drona__tab'));
        const panels = Array.from(section.querySelectorAll('.kl-drona__panels'));
        let active = compact.matches ? -1 : 0;
        function render(animate) {
            section.classList.add('is-enhanced', 'is-in');
            stage.setAttribute('role', compact.matches ? 'group' : 'tablist');
            stage.setAttribute('aria-label', 'How Kanan changes the financing workflow');
            buttons.forEach((button, i) => {
                const selected = i === active;
                button.setAttribute('aria-controls', panels[i].id);
                if (compact.matches) {
                    button.removeAttribute('role');
                    button.removeAttribute('aria-selected');
                    button.setAttribute('aria-expanded', String(selected));
                    button.tabIndex = 0;
                    panels[i].setAttribute('role', 'region');
                } else {
                    button.setAttribute('role', 'tab');
                    button.setAttribute('aria-selected', String(selected));
                    button.removeAttribute('aria-expanded');
                    button.tabIndex = selected ? 0 : -1;
                    panels[i].setAttribute('role', 'tabpanel');
                }
                panels[i].hidden = !selected;
            });
            if (animate && active >= 0 && !reduced.matches && gsap) {
                gsap.fromTo(panels[active], { y: 8 }, { y: 0, duration: .4, overwrite: true, clearProps: 'transform' });
            }
            requestAnimationFrame(refreshLayout);
        }
        buttons.forEach((button, i) => {
            button.addEventListener('click', () => { active = compact.matches && active === i ? -1 : i; render(true); });
            button.addEventListener('keydown', event => {
                const keys = ['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'];
                if (!keys.includes(event.key)) return;
                event.preventDefault();
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
                    (i + (['ArrowDown','ArrowRight'].includes(event.key) ? 1 : -1) + buttons.length) % buttons.length;
                buttons[next].focus();
                if (!compact.matches) { active = next; render(true); }
            });
        });
        compact.addEventListener('change', () => {
            if (!compact.matches && active < 0) active = 0;
            render(false);
        });
        render(false);
    }

    function initReel() {
        if (!gsap) return;
        const section = $('#klScope'), list = $('#klScopeList');
        const originals = Array.from(list.children);
        let timeline = null, index = 0, slot = 0, running = false;
        originals.forEach(word => { const clone = word.cloneNode(true); clone.setAttribute('aria-hidden','true'); list.appendChild(clone); });
        const words = Array.from(list.children);
        function opacity(distance) {
            return distance === 0 ? 1 : distance === 1 ? .3 : distance === 2 ? .1 : 0;
        }
        function position() {
            words.forEach((word,i) => {
                let distance = (i - index + words.length) % words.length;
                if (distance > words.length / 2) distance -= words.length;
                word.dataset.slot = String(distance);
                gsap.set(word, { xPercent: -50, yPercent: -50, y: distance * slot, opacity: opacity(Math.abs(distance)) });
            });
        }
        function build() {
            if (timeline) timeline.kill();
            timeline = null;
            if (reduced.matches) return;
            section.classList.add('is-animated');
            slot = Math.max(...originals.map(word => word.getBoundingClientRect().height));
            section.querySelector('.kl-scope__column').style.setProperty('--reel-slot', slot + 'px');
            position();
            timeline = gsap.timeline({ paused: true, repeat: -1, onRepeat() { index = (index + 1) % words.length; position(); } });
            const duration = compact.matches ? .5 : .75;
            const hold = compact.matches ? 1.5 : .75;
            timeline.to({}, { duration: hold });
            words.forEach(word => {
                timeline.to(word, { y: () => (Number(word.dataset.slot) - 1) * slot,
                    opacity: () => opacity(Math.abs(Number(word.dataset.slot) - 1)), duration,
                    ease: 'power2.inOut' }, hold);
            });
            timeline.eventCallback('onRepeat', () => {
                index = (index + 1) % words.length;
                position(); timeline.invalidate();
            });
            if (running) timeline.play();
        }
        const effect = register('reel', section, { resume() {
            running = true;
            if (!timeline) build();
            if (timeline) timeline.resume();
        }, pause() { running = false; if (timeline) timeline.pause(); }, static() {
            running = false;
            if (timeline) timeline.kill(); timeline = null;
            section.classList.remove('is-animated');
        } });
        let previousWidth = 0;
        const observer = new ResizeObserver(entries => {
            const width = entries[0].contentRect.width;
            if (Math.abs(width - previousWidth) > 1) { previousWidth = width; build(); }
        });
        observer.observe(section.querySelector('.kl-scope__inner'));
        document.fonts.ready.then(build);
        compact.addEventListener('change', build);
        cleanup.push(() => { observer.disconnect(); if (timeline) timeline.kill(); });
    }

    function initFunnel() {
        const section = $('#klDronaFunnel');
        const clips = Array.from(section.querySelectorAll('[data-clip]'));
        const stages = Array.from(section.querySelectorAll('[data-df-stage]'));
        const stations = Array.from(section.querySelectorAll('[data-station]'));
        const feeders = Array.from(section.querySelectorAll('.kl-df__feeders span'));
        const outputs = Array.from(section.querySelectorAll('.kl-df__outputs span'));
        const heights = [140,156,160];
        if (!gsap) return;
        let timeline;
        function stage(index) {
            [stages,stations].forEach(items => items.forEach((item,i) => {
                item.classList.toggle('is-active', i === index); item.classList.toggle('is-complete', i < index);
            }));
        }
        function reset() { clips.forEach(clip => clip.setAttribute('height','0')); stage(-1); }
        function build() {
            section.classList.add('is-animated'); reset();
            timeline = gsap.timeline({ paused:true, repeat:-1, onRepeat:reset });
            if (!compact.matches) {
                timeline.fromTo(feeders,{opacity:0,y:-8},{opacity:1,y:0,duration:.4,stagger:.08},0);
                timeline.fromTo(outputs,{opacity:0,y:10},{opacity:1,y:0,duration:.5,stagger:.15},5.8);
            }
            [0.65,2.25,4.1].forEach((time,i) => {
                timeline.call(() => stage(i),null,time);
                timeline.to(clips[i],{attr:{height:heights[i]},duration:[1.2,1.35,1.4][i],ease:'power1.inOut'},time);
            });
            timeline.to({}, {duration:3.55},6.45);
        }
        register('funnel', section.querySelector('.kl-df__visual'), {
            resume() { if (!timeline) build(); timeline.resume(); },
            pause() { if (timeline) timeline.pause(); },
            static() { if (timeline) timeline.kill(); timeline = null; section.classList.remove('is-animated');
                clips.forEach((clip,i) => clip.setAttribute('height',String(heights[i]))); stage(2);
                gsap.set([...feeders,...outputs],{opacity:1,y:0}); }
        });
    }

    function initGrid(id, color) {
        const canvas = document.getElementById(id), parent = canvas.parentElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let width = 0, height = 0, offset = 0, frame = 0, lastTime = 0;
        function draw() {
            ctx.clearRect(0,0,width,height); ctx.strokeStyle = color; ctx.lineWidth = 1;
            ctx.beginPath();
            for(let x = 0; x < width; x += 30) { ctx.moveTo(x+.5,0); ctx.lineTo(x+.5,height); }
            for(let y = offset-30; y < height; y += 30) { ctx.moveTo(0,y+.5); ctx.lineTo(width,y+.5); }
            ctx.stroke();
        }
        function tick(time) {
            if (lastTime) offset = (offset + Math.min(time-lastTime,50) * .0072) % 30;
            lastTime = time; draw(); frame = requestAnimationFrame(tick);
        }
        function pause() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
        function resize() {
            const rect = parent.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1,2);
            width = rect.width; height = rect.height;
            canvas.width = Math.ceil(width*dpr); canvas.height = Math.ceil(height*dpr);
            canvas.style.width = width+'px'; canvas.style.height = height+'px';
            ctx.setTransform(dpr,0,0,dpr,0,0); draw();
        }
        resize();
        const observer = new ResizeObserver(resize); observer.observe(parent);
        register(id,parent,{resume() { if (!frame) frame = requestAnimationFrame(tick); },pause,static() { pause(); draw(); }});
        cleanup.push(() => { pause(); observer.disconnect(); });
    }

    function initReveals() {
        if (!gsap || !window.ScrollTrigger) return;
        gsap.registerPlugin(window.ScrollTrigger);
        const media = gsap.matchMedia();
        media.add({ compact:'(max-width:1023px)', desktop:'(min-width:1024px)', reduced:'(prefers-reduced-motion: reduce)' },context => {
            const isCompact = context.conditions.compact;
            if (context.conditions.reduced) return;
            const cards = $$('.kl-triptych__card');
            // Text remains readable; entrances animate position rather than
            // leaving content invisible if a visitor scrolls past quickly.
            if (isCompact) {
                cards.forEach(card => gsap.fromTo(card,{y:16},{y:0,duration:.45,ease:'power2.out',
                    scrollTrigger:{trigger:card,start:'top 95%',once:true}}));
                $$('.kl-manifesto__group').forEach(group => {
                    const words = group.querySelectorAll('.kl-word');
                    gsap.fromTo(words,{opacity:.8,y:4,rotation:1},{opacity:1,y:0,rotation:0,duration:.4,stagger:{amount:.1},
                        scrollTrigger:{trigger:group,start:'top 95%',once:true}});
                });
            } else {
                gsap.fromTo(cards,{opacity:0,y:40},{opacity:1,y:0,duration:1,stagger:.1,
                    scrollTrigger:{trigger:'.kl-triptych',start:'top 82%',once:true}});
                const words = $$('#klManifestoReveal .kl-word');
                gsap.fromTo(words,{opacity:.12,filter:'blur(4px)',rotation:2},{opacity:1,filter:'blur(0px)',rotation:0,
                    stagger:{each:.04},ease:'none',scrollTrigger:{trigger:'#klManifestoReveal',start:'top bottom',end:'top 45%',scrub:1,invalidateOnRefresh:true}});
            }
            gsap.set('.kl-word--accent',{color:'#ffa892'});
        });
        cleanup.push(() => media.revert());
    }

    // Isolate optional enhancements: one unavailable effect cannot prevent
    // other controls from working or hide the server-rendered content.
    [initAudience, initVideo, initWorkflow, initReel, initFunnel,
        () => initGrid('triptych-grid','rgba(248,245,237,0.035)'),
        () => initGrid('manifesto-grid','rgba(255,255,255,0.05)'), initReveals].forEach(init => {
        try { init(); } catch (error) { console.error('Homepage enhancement unavailable:',error); }
    });
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(refreshLayout,150); });
    document.fonts.ready.then(refreshLayout);
    window.addEventListener('load',refreshLayout,{once:true});
    if ($('.sm-toggle')) initMenu();
    else document.addEventListener('DOMContentLoaded',initMenu,{once:true});
})();
