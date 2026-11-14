(function () {
  'use strict';

  const HOLD = 3000;
  const FLY = 900;
  const STAGGER = [0, 45, 90];
  const EASE = 'cubic-bezier(.76,0,.24,1)';
  const body = document.body;
  const intro = document.getElementById('intro');
  const veil = document.getElementById('veil');
  const header = document.getElementById('header');

  if (!intro || !veil || !header) return;

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const background = Array.from(body.children).filter((element) =>
    element !== intro && !['SCRIPT', 'STYLE'].includes(element.tagName)
  );
  const inertBefore = background.map((element) => element.inert);
  const keys = ['emblem', 'word', 'sub'];
  let flown = false;
  let finished = false;
  let timer;
  let failsafe;

  function finish(forceAnimations = false) {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    clearTimeout(failsafe);
    if (forceAnimations && typeof intro.getAnimations === 'function') {
      intro.getAnimations({ subtree: true }).forEach((animation) => {
        try { animation.finish(); } catch { /* A cancelled animation is already settled. */ }
      });
    }
    body.classList.add('reveal');
    body.classList.add('landed');
    body.classList.remove('intro-lock');
    background.forEach((element, index) => { element.inert = inertBefore[index]; });
    intro.remove();
    document.removeEventListener('keydown', onKey);
    document.dispatchEvent(new Event('glow-intro-complete'));
  }

  function fly() {
    if (flown) return;
    flown = true;
    clearTimeout(timer);

    if (typeof intro.animate !== 'function' || typeof veil.animate !== 'function') {
      finish();
      return;
    }

    intro.classList.add('drawn');
    intro.style.cursor = 'default';
    const closeAnimations = [veil.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 800,
      delay: 180,
      easing: 'ease',
      fill: 'forwards'
    })];
    setTimeout(() => body.classList.add('reveal'), 360);

    keys.forEach((key, index) => {
      const source = intro.querySelector(`.o-${key}`);
      const target = header.querySelector(`.h-${key}`);
      const from = source.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const scale = to.width / from.width;
      const dx = to.left - from.left;
      const dy = to.top - from.top;
      const animation = source.animate(
        [
          { transform: 'translate(0,0) scale(1)' },
          { transform: `translate(${dx}px,${dy}px) scale(${scale})` }
        ],
        { duration: FLY, delay: STAGGER[index], easing: EASE, fill: 'forwards' }
      );
      closeAnimations.push(animation);
    });

    // Keep the stroke reveal gated until both the logo has landed and the
    // opening veil has finished fading away.
    Promise.allSettled(closeAnimations.map((animation) => animation.finished)).then((results) => {
      finish(results.some((result) => result.status === 'rejected'));
    });
  }

  function onKey(event) {
    if (['Enter', ' ', 'Escape'].includes(event.key)) {
      event.preventDefault();
      fly();
    } else if (event.key === 'Tab' && !flown) {
      event.preventDefault();
      intro.focus({ preventScroll: true });
    }
  }

  function start() {
    if (flown) return;
    requestAnimationFrame(() => {
      if (flown) return;
      intro.classList.add('go');
      timer = setTimeout(fly, HOLD);
      failsafe = setTimeout(() => finish(true), 7000);
    });
  }

  background.forEach((element) => { element.inert = true; });
  intro.addEventListener('click', fly);
  document.addEventListener('keydown', onKey);
  header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (prefersReducedMotion) {
    clearTimeout(failsafe);
    body.classList.add('reveal');
    finish();
    return;
  }

  const pageReady = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    })
  ]);

  Promise.race([
    pageReady,
    new Promise((resolve) => setTimeout(resolve, 2500))
  ]).then(start);
})();
