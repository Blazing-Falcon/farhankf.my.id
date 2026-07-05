import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

declare global {
  interface Window {
    __gsapPluginsRegistered?: boolean;
  }
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  if (!window.__gsapPluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    window.__gsapPluginsRegistered = true;
  }

  // Hero load sequence: headline lines slide up from behind an overflow mask,
  // mascot pops in last with a small overshoot.
  const heroLines = document.querySelectorAll<HTMLElement>('[data-hero-line]');
  const heroMascot = document.querySelector<HTMLElement>('[data-hero-mascot]');

  if (heroLines.length) {
    gsap.set(heroLines, { yPercent: 110 });
    gsap.to(heroLines, {
      yPercent: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.08,
    });
  }

  if (heroMascot) {
    gsap.set(heroMascot, { scale: 0.6, opacity: 0 });
    gsap.to(heroMascot, {
      scale: 1,
      opacity: 1,
      duration: 0.6,
      ease: 'back.out(1.7)',
      delay: heroLines.length ? heroLines.length * 0.08 + 0.2 : 0,
    });
  }

  // Scroll reveals: fade in and rise on entering the viewport, once.
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.set(el, { opacity: 0, y: 24 });
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });
  });

  // Parallax accents: decorative paw prints and scribbles drift slower than scroll.
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  if (!isMobile) {
    document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
      gsap.to(el, {
        yPercent: -15,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.85,
        },
      });
    });
  }
} else {
  // Reduced motion: ensure all normally-animated content is immediately visible.
  document.querySelectorAll<HTMLElement>('[data-reveal], [data-hero-line], [data-hero-mascot]').forEach(
    (el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    }
  );
}
