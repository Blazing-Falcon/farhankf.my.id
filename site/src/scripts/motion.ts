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

// Scroll reveals: fade in and rise, once.
//
// The hidden start state lives in global.css (`[data-reveal]` under
// `@media (scripting: enabled)`), NOT here. This script is deferred, so hiding
// elements at this point happens after the server-rendered content has already
// painted — a flash of content that then blanks on a slow connection. Revealing
// an element therefore means removing its `data-reveal` attribute, which stops
// the CSS rule from matching.
//
// This class stands down the CSS dead-man's switch that would otherwise reveal
// everything at 3s. Set it here — after the hero code, immediately before the
// observer that takes over responsibility for revealing — and not at the top of
// the file: if anything above throws, the reveal setup below never runs either,
// and we want CSS to still show the content rather than strand it blank.
document.documentElement.classList.add('motion-ready');

// The trigger runs *ahead* of the viewport (positive bottom rootMargin), not
// inside it. It used to be `-15%` — porting ScrollTrigger's `start: 'top 85%'`
// literally — which left an element whose top sat just past the 85% line blank
// until you nudged the scroll: the project detail body copy begins right below
// the cover image and did exactly that. Revealing early costs nothing visually
// (the fade still plays as you approach) and content is simply there.
const REVEAL_LEAD_PX = 300;
// Failsafe: an element that never intersects (zero area, display quirk) would
// otherwise stay hidden forever. Hidden content is a worse failure than a
// skipped animation, so show anything still pending after this.
const REVEAL_FAILSAFE_MS = 3000;

const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (revealEls.length) {
  const pending = new Set<HTMLElement>(revealEls);

  const show = (el: HTMLElement, animate: boolean) => {
    if (!pending.delete(el)) return;
    observer.unobserve(el);
    el.removeAttribute('data-reveal');
    if (animate) {
      el.animate(
        { opacity: [0, 1], translate: ['0 24px', '0 0'] },
        { duration: 600, easing: EASE_OUT_CUBIC, fill: 'backwards' }
      );
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) show(entry.target as HTMLElement, true);
      }
    },
    { rootMargin: `0px 0px ${REVEAL_LEAD_PX}px 0px` }
  );

  revealEls.forEach((el) => observer.observe(el));

  setTimeout(() => {
    for (const el of [...pending]) show(el, false);
  }, REVEAL_FAILSAFE_MS);
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
