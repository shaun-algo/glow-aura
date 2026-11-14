(() => {
  const roots = Array.from(document.querySelectorAll('[data-stroke-text]'));
  if (!roots.length) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const WORD_FADE_DURATION = 0.82;
  const WORD_STAGGER = 0.18;
  const DRAW_DURATION = 2.3;
  const CHARACTER_STAGGER = 0.05;

  const buildWords = (textElement, value) => {
    textElement.replaceChildren();
    const words = value.trim().split(/\s+/);
    words.forEach((word, index) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.textContent = word;
      tspan.dataset.strokeWord = 'true';
      tspan.style.setProperty('--stroke-word-index', index);
      textElement.appendChild(tspan);
      if (index < words.length - 1) textElement.appendChild(document.createTextNode(' '));
    });
    return words.length;
  };

  const buildCharacters = (textElement, value) => {
    textElement.replaceChildren();
    Array.from(value).forEach((character, index) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.textContent = character;
      tspan.dataset.strokeChar = 'true';
      tspan.style.setProperty('--stroke-text-index', index);
      textElement.appendChild(tspan);
    });
  };

  const initialize = root => {
    const svg = root.querySelector('.stroke-text__svg');
    const outline = root.querySelector('[data-stroke-outline]');
    const fill = root.querySelector('[data-stroke-fill]');
    const prelude = root.querySelector('[data-stroke-prelude]');
    const wipe = root.querySelector('[data-stroke-wipe]');
    const value = root.dataset.strokeText || '';
    if (!svg || !outline || !fill || !prelude || !wipe || !value) return null;

    const wordCount = buildWords(prelude, value);
    root.style.setProperty('--stroke-word-fade-duration', `${WORD_FADE_DURATION}s`);
    root.style.setProperty('--stroke-word-stagger', `${WORD_STAGGER}s`);
    root.style.setProperty('--stroke-text-draw-duration', `${DRAW_DURATION}s`);
    root.style.setProperty('--stroke-text-char-stagger', `${CHARACTER_STAGGER}s`);
    root.style.setProperty('--stroke-text-wipe-delay', `${DRAW_DURATION + 0.15}s`);
    buildCharacters(outline, value);
    fill.textContent = value;
    let measuredViewBox = '';

    const measure = () => {
      let bbox;
      try { bbox = outline.getBBox(); } catch { return; }
      if (!bbox || !bbox.width || !bbox.height) return;

      const fontSize = 128;
      const pad = Math.max(1.7, fontSize * .1);
      const box = {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: bbox.width + pad * 2,
        height: bbox.height + pad * 2
      };

      const nextViewBox = `${box.x} ${box.y} ${box.width} ${box.height}`;
      if (nextViewBox !== measuredViewBox) {
        svg.setAttribute('viewBox', nextViewBox);
        measuredViewBox = nextViewBox;
      }
      wipe.setAttribute('x', box.x);
      wipe.setAttribute('y', box.y);
      wipe.setAttribute('height', box.height);
      wipe.setAttribute('width', prefersReducedMotion ? box.width : 0);
      root.style.setProperty('--stroke-text-dash', `${Math.max(fontSize * 7, 200)}px`);
      root.style.setProperty('--stroke-text-wipe-width', `${box.width}px`);
      root.classList.toggle('stroke-text--reduced', prefersReducedMotion);
    };

    // Measure before the intro reveals the hero so the first visible frame has
    // its final geometry instead of jumping when the font settles.
    measure();
    const fontsReady = (document.fonts?.ready || Promise.resolve()).then(measure, () => {});

    return { root, wordCount, fontsReady };
  };

  const instances = roots.map(initialize).filter(Boolean);
  const start = () => {
    Promise.all(instances.map(instance => instance.fontsReady)).then(() => {
      requestAnimationFrame(() => {
        instances.forEach(({ root, wordCount }) => {
          if (prefersReducedMotion) return;
          root.classList.add('stroke-text--word-reveal');
          const wordSequence = WORD_FADE_DURATION + Math.max(0, wordCount - 1) * WORD_STAGGER;
          window.setTimeout(() => root.classList.add('stroke-text--animate'), (wordSequence + 0.14) * 1000);
        });
      });
    });
  };

  if (document.getElementById('intro') && !document.body.classList.contains('landed')) {
    document.addEventListener('glow-intro-complete', start, { once: true });
  } else {
    start();
  }
})();
