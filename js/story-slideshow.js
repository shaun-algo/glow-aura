(() => {
  'use strict';

  const root = document.querySelector('[data-story-slideshow]');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('[data-story-slide]'));
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const autoplayDelay = 2000;
  let active = Math.max(0, slides.findIndex(slide => slide.classList.contains('is-active')));
  let timer = 0;
  let isVisible = false;

  if (!slides.length) return;

  const stop = () => {
    window.clearTimeout(timer);
    timer = 0;
  };

  const setSlide = index => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const selected = slideIndex === active;
      slide.classList.toggle('is-active', selected);
      slide.setAttribute('aria-hidden', String(!selected));
      slide.toggleAttribute('inert', !selected);
    });
  };

  const schedule = () => {
    stop();
    if (reducedMotion || !isVisible || document.hidden || root.matches(':hover') || root.contains(document.activeElement)) return;
    timer = window.setTimeout(() => {
      setSlide(active + 1);
      schedule();
    }, autoplayDelay);
  };

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', schedule);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', event => {
    if (!root.contains(event.relatedTarget)) schedule();
  });
  document.addEventListener('visibilitychange', schedule);

  root.classList.add('is-ready');
  setSlide(active);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      isVisible = entries.some(entry => entry.isIntersecting);
      schedule();
    }, { threshold: 0.2 });
    observer.observe(root);
  } else {
    isVisible = true;
    schedule();
  }
})();
