// Founders section: vanilla port of the React Bits "Chroma Grid".
// Cards sit in greyscale; a soft spotlight that follows the pointer brings the
// colour back. Unlike the original, the greyscale layers live inside each card
// (so the bio text beneath a card is never filtered), and one shared spotlight
// position is written to every card relative to its own box, so the light
// still reads as a single beam crossing the gap between cards.
// Uses window.gsap when present (loaded by team.html); falls back to direct
// CSS-variable writes without easing.

const DEFAULTS = Object.freeze({
    radius: 260,
    damping: 0.45,
    fadeOut: 0.6,
    fadeIn: 0.25,
    ease: 'power3.out'
});

function measureCards(root, cards) {
    const rootRect = root.getBoundingClientRect();
    return cards.map(card => {
        const r = card.getBoundingClientRect();
        return { card, left: r.left - rootRect.left, top: r.top - rootRect.top };
    });
}

export function initChromaGrid(root, options = {}) {
    if (!root) return null;
    const opts = Object.freeze({ ...DEFAULTS, ...options });
    const cards = Array.from(root.querySelectorAll('.chroma-card'));
    const veils = cards.map(card => card.querySelector('.chroma-fade')).filter(Boolean);
    if (!cards.length) return null;

    const gsap = window.gsap;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pos = { x: 0, y: 0 };
    let offsets = measureCards(root, cards);

    root.style.setProperty('--r', `${opts.radius}px`);

    const writeSpotlight = () => {
        offsets.forEach(({ card, left, top }) => {
            card.style.setProperty('--x', `${pos.x - left}px`);
            card.style.setProperty('--y', `${pos.y - top}px`);
        });
    };

    const setVeils = (opacity, duration) => {
        if (gsap && !reduceMotion) {
            gsap.to(veils, { opacity, duration, overwrite: true });
        } else {
            veils.forEach(v => { v.style.opacity = String(opacity); });
        }
    };

    const moveTo = (x, y) => {
        if (gsap && !reduceMotion) {
            gsap.to(pos, {
                x, y,
                duration: opts.damping,
                ease: opts.ease,
                overwrite: true,
                onUpdate: writeSpotlight
            });
        } else {
            pos.x = x;
            pos.y = y;
            writeSpotlight();
        }
    };

    const centre = () => {
        const { width, height } = root.getBoundingClientRect();
        pos.x = width / 2;
        pos.y = height / 2;
        writeSpotlight();
    };

    const onPointerMove = e => {
        const r = root.getBoundingClientRect();
        moveTo(e.clientX - r.left, e.clientY - r.top);
        setVeils(0, opts.fadeIn);
    };

    const onPointerLeave = () => setVeils(1, opts.fadeOut);

    // Inner highlight per card (the original's --mouse-x / --mouse-y).
    const onCardMove = e => {
        const card = e.currentTarget;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
    };

    const onResize = () => {
        offsets = measureCards(root, cards);
        writeSpotlight();
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(root);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerdown', onPointerMove);
    root.addEventListener('pointerleave', onPointerLeave);
    cards.forEach(card => card.addEventListener('pointermove', onCardMove));
    centre();

    return {
        destroy() {
            resizeObserver.disconnect();
            root.removeEventListener('pointermove', onPointerMove);
            root.removeEventListener('pointerdown', onPointerMove);
            root.removeEventListener('pointerleave', onPointerLeave);
            cards.forEach(card => card.removeEventListener('pointermove', onCardMove));
            if (gsap) gsap.killTweensOf([pos, ...veils]);
        }
    };
}

const grid = document.querySelector('[data-chroma]');
if (grid) {
    try {
        initChromaGrid(grid);
    } catch (err) {
        // The cards are fully usable (greyscale) without the effect.
        console.error('Founders grid effect failed to start:', err);
    }
}
