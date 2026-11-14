(() => {
  'use strict';

  const hero = document.querySelector('.home-hero');
  const canvas = document.getElementById('heroLightPillar');
  if (!hero || !canvas) return;

  const VERTEX = [
    '#version 300 es',
    'in vec2 aPosition;',
    'void main(){gl_Position=vec4(aPosition,0.0,1.0);}'
  ].join('\n');

  const MARCH = [
    '#version 300 es',
    'precision highp float;',
    'uniform float uTime;uniform vec2 uResolution;uniform vec2 uTarget;uniform vec2 uRot;uniform vec2 uPillarRot;uniform vec2 uWave;',
    'uniform float uShift;uniform float uPillarWidth;uniform float uPillarHeight;uniform int uDetail;uniform vec3 uTopColor;uniform vec3 uBottomColor;',
    'uniform float uGlowAmount;uniform float uWidthNorm;',
    'out vec4 outColor;',
    'void main(){',
    'vec2 vUv=gl_FragCoord.xy/uTarget;',
    'vec2 uv=(vUv*2.0-1.0)*vec2(uResolution.x/uResolution.y,1.0);',
    'uv.x-=uShift;',
    'uv=vec2(uPillarRot.x*uv.x-uPillarRot.y*uv.y,uPillarRot.y*uv.x+uPillarRot.x*uv.y);',
    'vec3 ro=vec3(0.0,0.0,-10.0);',
    'vec3 rd=normalize(vec3(uv,1.0));',
    'vec3 origin=vec3(uRot.x*ro.x-uRot.y*ro.z,ro.y,uRot.y*ro.x+uRot.x*ro.z);',
    'vec3 dir=vec3(uRot.x*rd.x-uRot.y*rd.z,rd.y,uRot.y*rd.x+uRot.x*rd.z);',
    'float glow=0.0;float lift=0.0;float t=0.1;',
    'for(int i=0;i<80;i++){',
    'vec3 p=origin+dir*t;vec3 q=p;',
    'q.y=p.y*uPillarHeight+uTime;',
    'float freq=1.0;float amp=1.0;',
    'for(int j=0;j<6;j++){',
    'if(j>=uDetail)break;',
    'q.xz=vec2(uWave.y*q.x-uWave.x*q.z,uWave.x*q.x+uWave.y*q.z);',
    'q+=cos(q.zxy*freq-uTime*float(j)*2.0)*amp;',
    'freq*=2.0;amp*=0.5;',
    '}',
    'float d=length(cos(q.xz))-0.2;',
    'float bound=length(p.xz)-uPillarWidth;',
    'float h=max(4.0-abs(d-bound),0.0);',
    'd=max(d,bound)+h*h*0.015625;',
    'd=abs(d)*0.15+0.01;',
    'float weight=1.0/d;',
    'glow+=weight;',
    'lift+=clamp((15.0-p.y)/30.0,0.0,1.0)*weight;',
    't+=d;',
    'if(t>50.0)break;',
    '}',
    'vec3 col=tanh((uBottomColor*glow+(uTopColor-uBottomColor)*lift)*uGlowAmount/uWidthNorm);',
    'float peak=max(col.r,max(col.g,col.b));',
    'outColor=vec4(col,smoothstep(0.62,1.0,peak));',
    '}'
  ].join('\n');

  const COMPOSITE = [
    '#version 300 es',
    'precision highp float;',
    'uniform sampler2D uField;uniform vec2 uFieldSize;uniform vec2 uView;uniform vec2 uAspect;uniform vec2 uPillarRot;',
    'uniform float uShift;uniform float uIntensity;uniform float uNoiseIntensity;uniform float uLightMode;uniform float uNeutral;',
    'uniform float uBloom;uniform float uFade;uniform float uReveal;uniform float uFlare;uniform vec4 uPulses[3];',
    'out vec4 outColor;',
    'vec3 tap(vec2 uv){return textureLod(uField,uv,0.0).rgb;}',
    'vec3 bicubic(vec2 uv){',
    'vec2 position=uv*uFieldSize;vec2 center=floor(position-0.5)+0.5;vec2 f=position-center;',
    'vec2 w0=f*(-0.5+f*(1.0-0.5*f));vec2 w1=1.0+f*f*(-2.5+1.5*f);vec2 w2=f*(0.5+f*(2.0-1.5*f));vec2 w3=f*f*(-0.5+0.5*f);',
    'vec2 w12=w1+w2;vec2 t0=(center-1.0)/uFieldSize;vec2 t3=(center+2.0)/uFieldSize;vec2 t12=(center+w2/w12)/uFieldSize;',
    'vec3 r=vec3(0.0);',
    'r+=tap(vec2(t0.x,t0.y))*w0.x*w0.y;r+=tap(vec2(t12.x,t0.y))*w12.x*w0.y;r+=tap(vec2(t3.x,t0.y))*w3.x*w0.y;',
    'r+=tap(vec2(t0.x,t12.y))*w0.x*w12.y;r+=tap(vec2(t12.x,t12.y))*w12.x*w12.y;r+=tap(vec2(t3.x,t12.y))*w3.x*w12.y;',
    'r+=tap(vec2(t0.x,t3.y))*w0.x*w3.y;r+=tap(vec2(t12.x,t3.y))*w12.x*w3.y;r+=tap(vec2(t3.x,t3.y))*w3.x*w3.y;',
    'return max(r,0.0);',
    '}',
    'float smootherstep01(float t){t=clamp(t,0.0,1.0);return t*t*t*(t*(t*6.0-15.0)+10.0);}',
    'void main(){',
    'vec2 uv=gl_FragCoord.xy/uView;',
    'vec3 col=bicubic(uv);',
    'if(uBloom>0.0){',
    'vec4 l3=textureLod(uField,uv,3.0);vec4 l4=textureLod(uField,uv,4.0);vec4 l5=textureLod(uField,uv,5.0);vec4 l6=textureLod(uField,uv,6.0);',
    'float halo=l3.a*0.3+l4.a*0.3+l5.a*0.25+l6.a*0.15;',
    'vec3 tint=l4.rgb+l5.rgb;tint/=max(max(tint.r,max(tint.g,tint.b)),0.001);',
    'vec3 glow=clamp(tint*halo*uBloom*1.1,0.0,1.0);',
    'col=1.0-(1.0-clamp(col,0.0,1.0))*(1.0-glow);',
    '}',
    'vec2 p=(uv*2.0-1.0)*uAspect;p.x-=uShift;',
    'float axis=uPillarRot.y*p.x+uPillarRot.x*p.y;',
    'float boost=0.0;',
    'for(int i=0;i<3;i++){',
    'vec4 pulse=uPulses[i];',
    'if(pulse.y<=0.0)continue;',
    'float offset=(axis-pulse.x)/0.24;',
    'boost+=exp(-offset*offset)*pulse.y;',
    '}',
    'float lum=max(col.r,max(col.g,col.b));',
    'col+=mix(col,vec3(lum),0.45)*boost*1.8;',
    'col-=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)/15.0*uNoiseIntensity;',
    'vec3 result=clamp(col*uIntensity,0.0,1.0);',
    'float mask=1.0;',
    'float edge=uFade*0.5;',
    'if(edge>0.0){',
    'mask*=smootherstep01(uv.x/edge)*smootherstep01((1.0-uv.x)/edge);',
    'mask*=smootherstep01(uv.y/edge)*smootherstep01((1.0-uv.y)/edge);',
    '}',
    'if(uLightMode>0.5){',
    'float energy=max(result.r,max(result.g,result.b));',
    'vec3 hue=result/max(energy,0.001);',
    'float coverage=smoothstep(0.025,0.95,energy);',
    'hue=pow(clamp(hue,0.0,1.0),vec3(1.25));',
    'vec3 tinted=mix(vec3(1.0),hue,coverage*0.94*mask);',
    'vec3 ink=vec3(1.0)-pow(result,vec3(1.6))*0.85*mask;',
    'result=mix(tinted,ink,uNeutral);',
    '}else{result*=mask;}',
    'outColor=vec4(result,1.0);',
    '}'
  ].join('\n');

  const QUALITY = { low: .4, medium: .7, high: 1 };
  const MIN_SCALE = .25;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ease = value => value * value * value * (value * (value * 6 - 15) + 10);
  const toRgb = hex => {
    const value = parseInt(hex.slice(1), 16);
    return [(value >> 16 & 255) / 255, (value >> 8 & 255) / 255, (value & 255) / 255];
  };

  const settings = {
    topColor: '#f3b7c1',
    bottomColor: '#6a3044',
    intensity: .58,
    glowAmount: .0015,
    bloom: .38,
    pillarWidth: 2.4,
    pillarHeight: .35,
    pillarRotation: 20,
    twist: .25,
    detail: 5,
    rotationSpeed: .16,
    flow: .8,
    noiseIntensity: .08,
    fade: .35,
    quality: 'high',
    interactive: false,
    clickPulse: false,
    lightMode: false,
    paused: false
  };

  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance'
  });
  if (!gl) return;

  const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  };
  const link = fragmentSource => {
    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let index = 0; index < count; index += 1) {
      const info = gl.getActiveUniform(program, index);
      if (info) uniforms[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(program, info.name);
    }
    return { program, uniforms };
  };

  const march = link(MARCH);
  const composite = link(COMPOSITE);
  if (!march || !composite) return;

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  let texture = null;
  const framebuffer = gl.createFramebuffer();
  const target = { width: 0, height: 0 };
  const sizeTarget = (width, height) => {
    if (target.width === width && target.height === height) return;
    target.width = width;
    target.height = height;
    if (texture) gl.deleteTexture(texture);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;
    gl.texStorage2D(gl.TEXTURE_2D, levels, floatTargets ? gl.RGBA16F : gl.RGBA8, width, height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  };

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const view = { width: 1, height: 1 };
  const pulseData = new Float32Array(12);
  const state = { clock: 0, governor: 1, slow: 0, quick: 0 };
  let raf = 0;
  let last = 0;
  let visible = true;

  const render = () => {
    const scale = Math.max(MIN_SCALE, clamp(QUALITY[settings.quality], MIN_SCALE, 2) * state.governor);
    sizeTarget(Math.max(1, Math.round(view.width * scale)), Math.max(1, Math.round(view.height * scale)));
    const tilt = settings.pillarRotation * Math.PI / 180;
    const angle = state.clock * .3;
    const width = settings.pillarWidth;
    gl.bindVertexArray(vao);
    const marchUniforms = march.uniforms;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.useProgram(march.program);
    gl.uniform1f(marchUniforms.uTime, state.clock * settings.flow);
    gl.uniform2f(marchUniforms.uResolution, view.width, view.height);
    gl.uniform2f(marchUniforms.uTarget, target.width, target.height);
    gl.uniform2f(marchUniforms.uRot, Math.cos(angle), Math.sin(angle));
    gl.uniform2f(marchUniforms.uPillarRot, Math.cos(tilt), Math.sin(tilt));
    gl.uniform2f(marchUniforms.uWave, Math.sin(settings.twist), Math.cos(settings.twist));
    gl.uniform1f(marchUniforms.uShift, 0);
    gl.uniform1f(marchUniforms.uPillarWidth, width);
    gl.uniform1f(marchUniforms.uPillarHeight, settings.pillarHeight);
    gl.uniform1i(marchUniforms.uDetail, Math.round(clamp(settings.detail, 1, 6)));
    gl.uniform3fv(marchUniforms.uTopColor, toRgb(settings.topColor));
    gl.uniform3fv(marchUniforms.uBottomColor, toRgb(settings.bottomColor));
    gl.uniform1f(marchUniforms.uGlowAmount, settings.glowAmount);
    gl.uniform1f(marchUniforms.uWidthNorm, width / 3);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (settings.bloom > 0) gl.generateMipmap(gl.TEXTURE_2D);

    pulseData.fill(0);
    const compositeUniforms = composite.uniforms;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(composite.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(compositeUniforms.uField, 0);
    gl.uniform2f(compositeUniforms.uFieldSize, target.width, target.height);
    gl.uniform2f(compositeUniforms.uView, canvas.width, canvas.height);
    gl.uniform2f(compositeUniforms.uAspect, view.width / view.height, 1);
    gl.uniform2f(compositeUniforms.uPillarRot, Math.cos(tilt), Math.sin(tilt));
    gl.uniform1f(compositeUniforms.uShift, 0);
    gl.uniform1f(compositeUniforms.uIntensity, settings.intensity);
    gl.uniform1f(compositeUniforms.uNoiseIntensity, settings.noiseIntensity);
    gl.uniform1f(compositeUniforms.uLightMode, settings.lightMode ? 1 : 0);
    const chroma = rgb => Math.max(...rgb) - Math.min(...rgb);
    const vivid = Math.max(chroma(toRgb(settings.topColor)), chroma(toRgb(settings.bottomColor)));
    gl.uniform1f(compositeUniforms.uNeutral, 1 - clamp((vivid - .08) / .12, 0, 1));
    gl.uniform1f(compositeUniforms.uBloom, settings.bloom);
    gl.uniform1f(compositeUniforms.uFade, settings.fade);
    gl.uniform1f(compositeUniforms.uReveal, 1e4);
    gl.uniform1f(compositeUniforms.uFlare, 0);
    gl.uniform4fv(compositeUniforms.uPulses, pulseData);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const wake = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const tune = delta => {
    if (delta > 1 / 40) {
      state.slow += 1;
      state.quick = 0;
    } else if (delta < 1 / 55) {
      state.quick += 1;
      state.slow = 0;
    }
    if (state.slow > 20) {
      state.governor = Math.max(.5, state.governor * .85);
      state.slow = 0;
    } else if (state.quick > 180 && state.governor < 1) {
      state.governor = Math.min(1, state.governor * 1.1);
      state.quick = 0;
    }
  };

  const frame = now => {
    raf = 0;
    if (!visible || document.hidden) return;
    const delta = last ? Math.min(.05, (now - last) / 1000) : 1 / 60;
    if (last) tune((now - last) / 1000);
    last = now;
    const running = !settings.paused && !reducedMotion && settings.rotationSpeed !== 0;
    if (running) state.clock += delta * .96 * settings.rotationSpeed;
    render();
    if (running) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const resize = () => {
    const width = Math.max(1, hero.clientWidth);
    const height = Math.max(1, hero.clientHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    view.width = width;
    view.height = height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    render();
    wake();
  };

  const syncTheme = () => {
    const light = document.body.dataset.theme === 'light';
    settings.lightMode = light;
    settings.intensity = light ? .84 : .58;
    canvas.style.mixBlendMode = light ? 'multiply' : 'screen';
    canvas.style.opacity = light ? '.52' : '.62';
    wake();
  };

  document.addEventListener('visibilitychange', () => {
    last = 0;
    wake();
  });
  if (window.ResizeObserver) new ResizeObserver(resize).observe(hero);
  else window.addEventListener('resize', resize);
  if (window.IntersectionObserver) {
    new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      }
    }).observe(hero);
  }
  if (window.MutationObserver) new MutationObserver(syncTheme).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  syncTheme();
  resize();
})();
