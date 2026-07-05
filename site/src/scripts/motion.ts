// All motion runs on the Web Animations API — no GSAP. The keyframes' start
// states are applied only through animate() (`fill: 'backwards'`), so markup
// stays visible when JS is disabled and base CSS never hides content.

// Animations run unconditionally — including under prefers-reduced-motion.
// Owner's choice: Windows' "animation effects" toggle sets that flag for every
// desktop browser and was freezing the site for ordinary visitors.

// Cubic-bezier stand-ins for the GSAP eases the site was designed with.
const EASE_OUT_QUART = 'cubic-bezier(0.165, 0.84, 0.44, 1)'; // gsap power3.out
const EASE_OUT_CUBIC = 'cubic-bezier(0.215, 0.61, 0.355, 1)'; // gsap power2.out
const EASE_BACK_OUT = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // gsap back.out(1.7)

// All keyframes animate the individual `translate`/`scale` properties, never
// `transform`: a WAAPI transform keyframe *replaces* an element's base CSS
// transform (unlike GSAP, which merges), which un-centers the hero mascot
// (`translateX(-50%)`) and un-tilts the rotated cards mid-reveal.

// Hero load sequence: headline lines slide up from behind an overflow mask,
// mascot pops in last with a small overshoot.
const heroLines = document.querySelectorAll<HTMLElement>('[data-hero-line]');
heroLines.forEach((el, i) => {
  el.animate(
    { translate: ['0 110%', '0 0'] },
    { duration: 700, easing: EASE_OUT_QUART, delay: i * 80, fill: 'backwards' }
  );
});

const heroMascot = document.querySelector<HTMLElement>('[data-hero-mascot]');
if (heroMascot) {
  // Slides in from the right while growing. These keyframes override the
  // element's base `translate: -50%` centering while playing, so they include
  // it via calc() and end exactly on the base value.
  heroMascot.animate(
    {
      translate: ['calc(-50% + 80px) 0', '-50% 0'],
      scale: ['0.6', '1'],
      opacity: [0, 1],
    },
    {
      duration: 600,
      easing: EASE_BACK_OUT,
      delay: heroLines.length ? heroLines.length * 80 + 200 : 0,
      fill: 'backwards',
    }
  );
}

// Scroll reveals: fade in and rise on entering the viewport, once. The -15%
// bottom rootMargin matches ScrollTrigger's old `start: 'top 85%'`.
// The hidden start state is applied eagerly here (like the old gsap.set), not
// just inside the keyframes — otherwise below-the-fold content renders visible
// and flickers off/on when its reveal starts during a fast scroll.
const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (revealEls.length) {
  revealEls.forEach((el) => {
    el.style.opacity = '0';
    el.style.translate = '0 24px';
  });
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const el = entry.target as HTMLElement;
        el.style.opacity = '';
        el.style.translate = '';
        el.animate(
          { opacity: [0, 1], translate: ['0 24px', '0 0'] },
          { duration: 600, easing: EASE_OUT_CUBIC, fill: 'backwards' }
        );
      }
    },
    { rootMargin: '0% 0% -15% 0%' }
  );
  revealEls.forEach((el) => observer.observe(el));
}

// Parallax accents: decorative paw prints drift slower than scroll. The lerp
// tick approximates ScrollTrigger's `scrub: 0.85` smoothing.
const isMobile = window.matchMedia('(max-width: 767px)').matches;
const parallaxEls = document.querySelectorAll<HTMLElement>('[data-parallax]');
if (!isMobile && parallaxEls.length) {
  let current = 0;
  let raf = 0;

  const progress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  };

  const tick = () => {
    const target = -15 * progress();
    current += (target - current) * 0.12;
    parallaxEls.forEach((el) => {
      el.style.translate = `0 ${current.toFixed(3)}%`;
    });
    raf = Math.abs(target - current) > 0.01 ? requestAnimationFrame(tick) : 0;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: true }
  );
}
