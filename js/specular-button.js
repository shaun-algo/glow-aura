(() => {
  'use strict';

  const PAD = 24;
  const TAU = Math.PI * 2;

  const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

  const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uRadius;
uniform float uPx;
uniform float uSpot;
uniform vec2 uEntry;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform vec2 uWindow;
uniform float uThickness;
uniform float uGlow;
out vec4 outColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float loopPosition(vec2 p, vec2 b, float r) {
  vec2 inner = b - r;
  float arc = 1.5707963 * r;
  float quarter = inner.x + inner.y + arc;
  vec2 a = abs(p);
  vec2 q = a - inner;
  float s = q.x > 0.0 && q.y > 0.0
    ? inner.y + atan(q.y, q.x) * r
    : (q.x > q.y ? min(a.y, inner.y) : inner.y + arc + inner.x - min(a.x, inner.x));
  if (p.x < 0.0) s = p.y >= 0.0 ? 2.0 * quarter - s : 2.0 * quarter + s;
  else if (p.y < 0.0) s = 4.0 * quarter - s;
  return s / max(4.0 * quarter, 0.0001);
}

float lobe(float position, float center) {
  float gap = abs(fract(position - center + 0.5) - 0.5);
  return 1.0 - smoothstep(uWindow.x, uWindow.x + uWindow.y, gap);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = roundedBox(p, uHalf, uRadius);
  float position = loopPosition(p, uHalf, uRadius);
  float key = lobe(position, uSpot);
  float back = lobe(position, uSpot + 0.5);
  float streak = key + back * 0.45;
  float width = max(uThickness * uPx * mix(1.0, max(key, back), 0.6), 0.35);
  float band = smoothstep(-width - 0.6, -width + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float hair = smoothstep(-uPx - 0.6, -uPx + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float inside = 1.0 - smoothstep(-0.6, 0.6, d);
  vec2 pool = (p - uEntry) / (uHalf.y * vec2(1.6, 1.1));
  float glow = streak * 0.2 * exp(-abs(d + width * 0.5) / (5.0 * uPx)) + inside * 0.08 * exp(-dot(pool, pool));
  float light = clamp((band * streak + glow * uGlow) * uIntensity, 0.0, 1.0);
  vec4 base = vec4(uBaseColor, 1.0) * hair * 0.6;
  outColor = vec4(uLineColor, 1.0) * light + base * (1.0 - light);
}`;

  const UNIFORMS = [
    'uCenter', 'uHalf', 'uRadius', 'uPx', 'uSpot', 'uEntry',
    'uLineColor', 'uBaseColor', 'uIntensity', 'uWindow', 'uThickness', 'uGlow'
  ];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const wrap = value => value - Math.floor(value);

  const loopPosition = (x, y, halfX, halfY, radius) => {
    const innerX = halfX - radius;
    const innerY = halfY - radius;
    const arc = (Math.PI / 2) * radius;
    const quarter = innerX + innerY + arc;
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const qx = ax - innerX;
    const qy = ay - innerY;
    let position;
    if (qx > 0 && qy > 0) position = innerY + Math.atan2(qy, qx) * radius;
    else if (qx > qy) position = Math.min(ay, innerY);
    else position = innerY + arc + innerX - Math.min(ax, innerX);
    if (x < 0) position = y >= 0 ? 2 * quarter - position : 2 * quarter + position;
    else if (y < 0) position = 4 * quarter - position;
    return wrap(position / Math.max(4 * quarter, 0.0001));
  };

  const rimPoint = (position, halfX, halfY, radius) => {
    const innerX = halfX - radius;
    const innerY = halfY - radius;
    const arc = (Math.PI / 2) * radius;
    const quarter = innerX + innerY + arc;
    let distance = wrap(position) * 4 * quarter;
    let signX = 1;
    let signY = 1;

    if (distance > 3 * quarter) {
      distance = 4 * quarter - distance;
      signY = -1;
    } else if (distance > 2 * quarter) {
      distance -= 2 * quarter;
      signX = -1;
      signY = -1;
    } else if (distance > quarter) {
      distance = 2 * quarter - distance;
      signX = -1;
    }

    let x = innerX - (distance - innerY - arc);
    let y = halfY;
    if (distance <= innerY) {
      x = halfX;
      y = distance;
    } else if (distance <= innerY + arc) {
      const angle = (distance - innerY) / Math.max(radius, 0.0001);
      x = innerX + Math.cos(angle) * radius;
      y = innerY + Math.sin(angle) * radius;
    }
    return [x * signX, y * signY];
  };

  const compile = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  };

  const link = gl => {
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    gl.deleteProgram(program);
    return null;
  };

  const readNumber = (button, name, fallback) => {
    const value = Number(button.dataset[name]);
    return Number.isFinite(value) ? value : fallback;
  };

  const readBoolean = (button, name, fallback) => {
    if (button.dataset[name] === undefined) return fallback;
    return button.dataset[name] !== 'false';
  };

  function setup(button) {
    const canvas = button.querySelector('.specular-button__light');
    const gl = canvas?.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false
    });
    if (!canvas || !gl) {
      button.classList.add('specular-button--fallback');
      return;
    }

    const program = link(gl);
    if (!program) {
      button.classList.add('specular-button--fallback');
      return;
    }

    const settings = {
      radius: Math.max(0, readNumber(button, 'sbRadius', 18)),
      lineColor: button.dataset.sbLineColor || '#f7ece8',
      baseColor: button.dataset.sbBaseColor || '#8f4c59',
      intensity: Math.max(0, readNumber(button, 'sbIntensity', 1)),
      idleIntensity: clamp(readNumber(button, 'sbIdleIntensity', .35), 0, 1),
      shineSize: Math.max(0, readNumber(button, 'sbShineSize', 10)),
      shineFade: Math.max(0, readNumber(button, 'sbShineFade', 34)),
      thickness: Math.max(0, readNumber(button, 'sbThickness', 1.2)),
      glow: Math.max(0, readNumber(button, 'sbGlow', 1)),
      followMouse: readBoolean(button, 'sbFollowMouse', true),
      proximity: Math.max(1, readNumber(button, 'sbProximity', 250)),
      autoAnimate: readBoolean(button, 'sbAutoAnimate', false),
      speed: readNumber(button, 'sbSpeed', .35),
      disabled: button.matches(':disabled')
    };

    const uniforms = {};
    for (const name of UNIFORMS) uniforms[name] = gl.getUniformLocation(program, name);
    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const colors = new Map();
    const view = { width: 1, height: 1, ratio: 1 };
    const pointer = { x: 0, y: 0, known: false };
    const state = { spot: 0, level: 0, press: 0, ready: false };
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let raf = 0;
    let last = 0;
    let visible = true;

    const toRgb = value => {
      if (colors.has(value)) return colors.get(value);
      let rgb = [1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        const [red, green, blue] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [red / 255, green / 255, blue / 255];
      }
      colors.set(value, rgb);
      return rgb;
    };

    const cornerRadius = () => Math.min(settings.radius, view.width / 2, view.height / 2);
    const restSpot = () => {
      const radius = cornerRadius();
      const inset = radius * (1 - Math.SQRT1_2);
      return loopPosition(inset - view.width / 2, view.height / 2 - inset, view.width / 2, view.height / 2, radius);
    };

    const aim = () => {
      if (!settings.followMouse || settings.disabled || !pointer.known) return null;
      const rect = button.getBoundingClientRect();
      const scale = rect.width / view.width || 1;
      const halfX = view.width / 2;
      const halfY = view.height / 2;
      const x = (pointer.x - rect.left - rect.width / 2) / scale;
      const y = (rect.top + rect.height / 2 - pointer.y) / scale;
      const distance = Math.hypot(Math.max(Math.abs(x) - halfX, 0), Math.max(Math.abs(y) - halfY, 0));
      const t = clamp(1 - distance / settings.proximity, 0, 1);
      const near = t * t * (3 - 2 * t);
      const nearest = loopPosition(x, y, halfX, halfY, cornerRadius());
      if (distance > 0) return { spot: nearest, near };
      const depth = clamp(Math.min(halfX - Math.abs(x), halfY - Math.abs(y)) / (halfY * .8), 0, 1);
      const sway = restSpot() - (x / halfX) * .06 - (y / halfY) * .02;
      const offset = sway - nearest - Math.round(sway - nearest);
      return { spot: wrap(nearest + offset * depth * depth * (3 - 2 * depth)), near };
    };

    const draw = () => {
      const { width, height } = view;
      const scaleX = canvas.width / (width + PAD * 2);
      const scaleY = canvas.height / (height + PAD * 2);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(uniforms.uCenter, (PAD + width / 2) * scaleX, (PAD + height / 2) * scaleY);
      gl.uniform2f(uniforms.uHalf, (width / 2) * scaleX, (height / 2) * scaleY);
      gl.uniform1f(uniforms.uRadius, Math.min(settings.radius, width / 2, height / 2) * scaleX);
      gl.uniform1f(uniforms.uPx, view.ratio);
      const radius = cornerRadius();
      const [rimX, rimY] = rimPoint(state.spot, width / 2, height / 2, radius);
      const pull = 1 - Math.min(.35 * (height / 2), Math.hypot(rimX, rimY)) / Math.max(Math.hypot(rimX, rimY), .0001);
      gl.uniform1f(uniforms.uSpot, state.spot);
      gl.uniform2f(uniforms.uEntry, rimX * pull * scaleX, rimY * pull * scaleY);
      gl.uniform3fv(uniforms.uLineColor, toRgb(settings.lineColor));
      gl.uniform3fv(uniforms.uBaseColor, toRgb(settings.baseColor));
      gl.uniform1f(uniforms.uIntensity, settings.intensity * (state.level + state.press * .8));
      gl.uniform2f(uniforms.uWindow, settings.shineSize / 360 + state.press * .06, settings.shineFade / 360 + .0001);
      gl.uniform1f(uniforms.uThickness, settings.thickness);
      gl.uniform1f(uniforms.uGlow, settings.glow);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    };

    const wake = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };

    const frame = now => {
      raf = 0;
      if (!visible) return;
      const delta = last ? Math.min(.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const target = aim();
      const spinning = settings.autoAnimate && !reduce;
      const steering = !!target && target.near > 0;
      if (!state.ready) {
        state.spot = restSpot();
        state.level = settings.autoAnimate ? 1 : settings.idleIntensity;
        state.ready = true;
      }
      let diff = 0;
      if (spinning && !steering) state.spot = wrap(state.spot + (settings.speed / TAU) * delta);
      else {
        diff = (steering ? target.spot : restSpot()) - state.spot;
        diff -= Math.round(diff);
        state.spot = wrap(state.spot + diff * (1 - Math.exp(-delta * 8)));
      }
      const level = settings.autoAnimate ? 1 : settings.idleIntensity + (1 - settings.idleIntensity) * (target ? target.near : 0);
      state.level += (level - state.level) * (1 - Math.exp(-delta * 7));
      state.press *= Math.exp(-delta * 5);
      draw();
      const settling = Math.abs(diff) > .0002 || Math.abs(level - state.level) > .001 || state.press > .002;
      if (settling || (spinning && !steering)) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const measure = entry => {
      const box = entry?.borderBoxSize?.[0];
      view.width = Math.max(1, box ? box.inlineSize : button.offsetWidth);
      view.height = Math.max(1, box ? box.blockSize : button.offsetHeight);
      view.ratio = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.max(1, Math.round((view.width + PAD * 2) * view.ratio));
      canvas.height = Math.max(1, Math.round((view.height + PAD * 2) * view.ratio));
      if (state.ready) draw();
      wake();
    };

    const onPointerMove = event => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.known = true;
      wake();
    };
    const onPointerDown = event => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.known = true;
      if (!settings.disabled) state.press = 1;
      wake();
    };
    const onPointerEnd = event => {
      if (event.pointerType === 'mouse') return;
      pointer.known = false;
      wake();
    };
    const onPointerLeave = () => {
      pointer.known = false;
      wake();
    };

    const resizeObserver = new ResizeObserver(entries => measure(entries[entries.length - 1]));
    resizeObserver.observe(button);
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      }
    });
    intersection.observe(button);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerEnd, { passive: true });
    window.addEventListener('pointercancel', onPointerEnd, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    button.addEventListener('pointerdown', onPointerDown);
    measure();
    wake();
  }

  document.querySelectorAll('[data-specular-button]').forEach(setup);
})();
