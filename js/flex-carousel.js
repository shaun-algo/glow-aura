(() => {
  'use strict';

  const root = document.querySelector('[data-flex-carousel]');
  if (!root) return;

  const viewport = root.querySelector('[data-flex-viewport]');
  const track = root.querySelector('[data-flex-track]');
  const sourceCards = track ? Array.from(track.querySelectorAll('[data-carousel-card]')) : [];
  const makeClone = card => {
    const clone = card.cloneNode(true);
    clone.dataset.clone = 'true';
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
    return clone;
  };
  const cards = sourceCards.length ? [
    ...sourceCards.map(makeClone),
    ...sourceCards,
    ...sourceCards.map(makeClone)
  ] : [];
  if (track && cards.length) track.replaceChildren(...cards);
  const caption = root.querySelector('.flex-carousel__caption');
  const title = root.querySelector('[data-carousel-title]');
  const blurb = root.querySelector('[data-carousel-blurb]');
  const comparePrice = root.querySelector('[data-carousel-compare]');
  const price = root.querySelector('[data-carousel-price]');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const preset = root.dataset.flexPreset || 'liquid';
  const fit = root.dataset.flexFit || 'natural';

  if (!viewport || !track || !cards.length) return;

  const itemCount = sourceCards.length;
  const loopStart = itemCount;
  const loopEnd = (itemCount * 2) - 1;

  let active = loopStart;
  let position = 0;
  let goal = 0;
  let raf = 0;
  let last = performance.now();
  let initialized = false;
  let dragging = false;
  let moved = false;
  let suppressClick = false;
  let pointerId = -1;
  let startX = 0;
  let startY = 0;
  let startPosition = 0;
  let captionTimer = 0;
  let wheelTimer = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  cards.forEach((card, index) => card.style.setProperty('--card-index', index));

  const targetFor = index => {
    const card = cards[index];
    if (!card) return 0;
    return viewport.clientWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);
  };

  const nearestIndex = (offset = position) => {
    const center = viewport.clientWidth / 2;
    let nearest = 0;
    let distance = Infinity;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2 + offset;
      const nextDistance = Math.abs(cardCenter - center);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = index;
      }
    });
    return nearest;
  };

  const bounds = () => ({
    min: targetFor(cards.length - 1),
    max: targetFor(0)
  });

  const loopedIndex = index => loopStart + ((index - loopStart) % itemCount + itemCount) % itemCount;

  const setNaturalCardSizes = () => {
    const media = cards[0]?.querySelector('.flex-carousel__media');
    const mediaHeight = media?.offsetHeight || 1;
    root.style.setProperty('--flex-carousel-half', `${(mediaHeight / 2).toFixed(2)}px`);
    root.style.setProperty('--flex-carousel-top', `${Math.max(24, (viewport.clientHeight - mediaHeight) / 2).toFixed(2)}px`);

    if (fit !== 'natural') return;
    const isSmall = window.matchMedia?.('(max-width: 575.98px)')?.matches ?? false;
    const maxWidth = isSmall ? Math.min(viewport.clientWidth * .76, 285) : Math.min(Math.max(viewport.clientWidth * .26, 290), 340);
    const minWidth = isSmall ? Math.min(200, maxWidth) : 220;
    cards.forEach(card => {
      const image = card.querySelector('img');
      const ratio = image?.naturalWidth && image?.naturalHeight ? image.naturalWidth / image.naturalHeight : .8;
      const width = clamp(ratio * mediaHeight, minWidth, maxWidth);
      card.style.flexBasis = `${width.toFixed(1)}px`;
    });
  };

  const updateCaption = index => {
    const card = cards[index];
    if (!card) return;
    if (title) title.textContent = card.dataset.title || '';
    if (blurb) blurb.textContent = card.dataset.blurb || '';
    if (comparePrice) comparePrice.textContent = card.dataset.compare || '';
    if (price) price.textContent = card.dataset.price || '';
    if (caption) {
      caption.classList.remove('is-updating');
      void caption.offsetWidth;
      caption.classList.add('is-updating');
      window.clearTimeout(captionTimer);
      captionTimer = window.setTimeout(() => caption.classList.remove('is-updating'), 560);
    }
  };

  const setActive = index => {
    const next = clamp(index, 0, cards.length - 1);
    if (next === active && initialized) return;
    active = next;
    updateCaption(active);
    cards.forEach((card, cardIndex) => {
      card.classList.toggle('is-active', cardIndex === active);
      card.setAttribute('aria-current', cardIndex === active ? 'true' : 'false');
    });
  };

  const normalizeLoop = () => {
    if (active >= loopStart && active <= loopEnd) return false;
    const next = loopedIndex(active);
    const offset = targetFor(next) - targetFor(active);
    position += offset;
    goal += offset;
    setActive(next);
    return true;
  };

  const applyTransforms = () => {
    track.style.transform = `translate3d(${position.toFixed(2)}px, 0, 0)`;
    const center = viewport.clientWidth / 2;
    const spread = Math.max(viewport.clientWidth * .72, 1);
    const focusOpen = root.classList.contains('is-focused');

    cards.forEach((card, index) => {
      const relative = card.offsetLeft + card.offsetWidth / 2 + position - center;
      const distance = clamp(Math.abs(relative) / spread, 0, 1.25);
      const proximity = 1 - clamp(Math.abs(relative) / spread, 0, 1);
      const scale = .82 + proximity * .3 + (focusOpen && index === active ? .05 : 0);
      const lift = focusOpen && index === active ? -5 : distance * distance * (preset === 'liquid' ? 16 : 10);
      const rotate = clamp(relative / spread, -1, 1) * (preset === 'liquid' ? 3.5 : 2.25);
      const isFocusedAway = focusOpen && index !== active;
      card.style.transform = `translate3d(0, ${lift.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${rotate.toFixed(2)}deg)`;
      card.style.opacity = isFocusedAway ? '.12' : String(Math.max(.46, 1 - distance * .48));
      card.style.zIndex = String(100 - Math.round(Math.abs(relative)));
    });

    setActive(nearestIndex());
  };

  const frame = now => {
    raf = 0;
    const delta = Math.min(.05, Math.max(.001, (now - last) / 1000));
    last = now;
    if (!dragging) {
      const blend = reducedMotion ? 1 : 1 - Math.exp(-delta * 6.5);
      position += (goal - position) * blend;
      if (Math.abs(goal - position) < .1) position = goal;
    }
    applyTransforms();
    if (!dragging && Math.abs(goal - position) <= .1 && normalizeLoop()) applyTransforms();
    if (dragging || Math.abs(goal - position) > .1) raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  const closeFocus = () => {
    if (!root.classList.contains('is-focused')) return;
    root.classList.remove('is-focused');
    applyTransforms();
  };

  const goTo = (index, immediate = false) => {
    window.clearTimeout(wheelTimer);
    closeFocus();
    const next = clamp(index, 0, cards.length - 1);
    goal = targetFor(next);
    if (immediate || reducedMotion) {
      position = goal;
      setActive(next);
    }
    applyTransforms();
    wake();
  };

  const measure = () => {
    setNaturalCardSizes();
    const firstWidth = cards[0]?.offsetWidth || 1;
    const edge = Math.max(0, (viewport.clientWidth - firstWidth) / 2);
    track.style.paddingLeft = `${edge}px`;
    track.style.paddingRight = `${edge}px`;
    goal = targetFor(active);
    if (!initialized || !dragging) position = goal;
    applyTransforms();
    initialized = true;
  };

  const waitForImages = () => {
    const images = cards.map(card => card.querySelector('img')).filter(Boolean);
    return Promise.all(images.map(image => {
      if (image.complete) return Promise.resolve();
      return new Promise(resolve => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    }));
  };

  const onPointerDown = event => {
    if (event.button !== undefined && event.button > 0) return;
    if (event.target.closest?.('.flex-carousel__shop')) return;
    dragging = false;
    moved = false;
    suppressClick = false;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startPosition = position;
    root.removeAttribute('data-hover');
  };

  const onPointerMove = event => {
    if (!dragging) {
      if (event.pointerId === pointerId && pointerId !== -1) {
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 7) return;

        // Let vertical gestures remain native page scrolling. Only claim the
        // pointer once a clear horizontal carousel swipe has begun.
        if (Math.abs(dy) >= Math.abs(dx)) {
          pointerId = -1;
          return;
        }

        dragging = true;
        moved = true;
        root.classList.add('is-dragging');
        root.setAttribute('data-dragging', '');
        try { viewport.setPointerCapture(pointerId); } catch {}
        wake();
      } else {
        if (root.classList.contains('is-focused')) {
          root.setAttribute('data-hover', 'close');
        } else if (event.target.closest?.('[data-carousel-card]')) {
          root.setAttribute('data-hover', 'open');
        } else {
          root.removeAttribute('data-hover');
        }
        return;
      }
    }
    if (event.pointerId !== pointerId) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 5) moved = true;
    const limits = bounds();
    const rawPosition = startPosition + delta;
    const overshoot = rawPosition < limits.min ? rawPosition - limits.min : rawPosition > limits.max ? rawPosition - limits.max : 0;
    position = rawPosition - overshoot * .72;
    goal = position;
    applyTransforms();
  };

  const onPointerUp = event => {
    if (event.pointerId !== pointerId) return;
    if (!dragging) {
      pointerId = -1;
      return;
    }
    dragging = false;
    root.classList.remove('is-dragging');
    root.removeAttribute('data-dragging');
    root.removeAttribute('data-hover');
    try { viewport.releasePointerCapture(pointerId); } catch {}
    pointerId = -1;
    if (moved) {
      suppressClick = true;
      goTo(nearestIndex());
    } else {
      goTo(nearestIndex());
    }
  };

  const onWheel = event => {
    if (event.ctrlKey) return;
    const delta = event.deltaX;
    if (!delta) return;
    event.preventDefault();
    closeFocus();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1;
    const step = clamp(delta * unit * .86, -150, 150);
    const limits = bounds();
    goal = clamp(goal - step, limits.min, limits.max);
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => goTo(nearestIndex(goal)), 180);
    wake();
  };

  cards.forEach((card, index) => {
    card.addEventListener('click', event => {
      if (suppressClick) {
        suppressClick = false;
        event.preventDefault();
        return;
      }
      const link = event.target.closest('a');
      event.preventDefault();
      if (index !== active) {
        goTo(index);
        return;
      }
      if (root.classList.contains('is-focused')) {
        if (link) window.location.href = link.href;
        return;
      }
      root.classList.add('is-focused');
      applyTransforms();
    });
  });

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('pointercancel', onPointerUp);
  root.addEventListener('pointerleave', () => {
    if (!dragging) root.removeAttribute('data-hover');
  });
  root.addEventListener('wheel', onWheel, { passive: false });
  root.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      goTo(active + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      goTo(active - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goTo(cards.length - 1);
    } else if (event.key === 'Escape') {
      closeFocus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (root.classList.contains('is-focused')) closeFocus();
      else root.classList.add('is-focused');
      applyTransforms();
    }
  });

  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measure).observe(viewport);
  window.addEventListener('resize', measure, { passive: true });
  measure();
  waitForImages().then(() => {
    measure();
    root.classList.add('is-ready');
    applyTransforms();
  });
})();
