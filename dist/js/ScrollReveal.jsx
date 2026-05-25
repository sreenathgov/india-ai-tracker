import { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

const ScrollReveal = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom'
}) => {
  const containerRef = useRef(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span className="word" key={index}>
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller =
      scrollContainerRef && scrollContainerRef.current
        ? scrollContainerRef.current
        : window;

    // Force a position refresh after layout settles — fixes stale trigger
    // positions when new sections pushed the manifesto element further down.
    // Declared outside gsap.context so the cleanup return can clear it.
    let refreshTimer = null;

    // gsap.context scopes all animations to this component — cleanup only
    // reverts these tweens, never touching CDN ScrollTriggers for other sections
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { transformOrigin: '0% 50%', rotate: baseRotation },
        {
          ease: 'none',
          rotate: 0,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top bottom',
            end: rotationEnd,
            scrub: 1,
            invalidateOnRefresh: true
          }
        }
      );

      const wordElements = el.querySelectorAll('.word');

      // Combine opacity + blur into one tween per word (halves tween count)
      gsap.fromTo(
        wordElements,
        {
          opacity: baseOpacity,
          willChange: 'opacity, filter',
          ...(enableBlur ? { filter: `blur(${blurStrength}px)` } : {})
        },
        {
          ease: 'none',
          opacity: 1,
          stagger: 0.05,
          ...(enableBlur ? { filter: 'blur(0px)' } : {}),
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top bottom-=20%',
            end: wordAnimationEnd,
            scrub: 1,
            invalidateOnRefresh: true
          }
        }
      );

      refreshTimer = setTimeout(() => {
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }, 400);

    }, el);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength]);

  return (
    <h2 ref={containerRef} className={`scroll-reveal ${containerClassName}`}>
      <p className={`scroll-reveal-text ${textClassName}`}>{splitText}</p>
    </h2>
  );
};

export default ScrollReveal;
