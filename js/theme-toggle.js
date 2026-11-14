(function(){
  function applyDarkTheme(){
    document.documentElement.dataset.theme="dark";
    if(document.body)document.body.dataset.theme="dark";
    try{localStorage.removeItem("glowaura-theme");}catch(err){}
  }

  applyDarkTheme();

  function ensureStyles(){
    if(document.getElementById("floating-scroll-top-styles"))return;
    const style=document.createElement("style");
    style.id="floating-scroll-top-styles";
    style.textContent=`
      .floating-scroll-top {
        position: fixed;
        right: 24px;
        bottom: 24px;
        width: 72px;
        height: 72px;
        padding: 0;
        border-radius: 50%;
        border: 0;
        background: transparent;
        color: #f6e3c3;
        display: grid;
        place-items: center;
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        transform: translateY(20px) scale(.88);
        transition: opacity .35s ease, transform .35s cubic-bezier(.2,.75,.25,1);
        z-index: 1500;
        -webkit-tap-highlight-color: transparent;
      }
      .floating-scroll-top__frame {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
        filter: drop-shadow(0 10px 14px rgba(0,0,0,.5));
        transition: filter .35s ease, transform .25s ease;
      }
      .floating-scroll-top__icon {
        position: relative;
        z-index: 1;
        display: grid;
        place-items: center;
        width: 29px;
        height: 29px;
        border-radius: 50%;
        color: #f6e3c3;
        font-size: 1.35rem;
        line-height: 1;
        text-shadow: 0 1px 0 rgba(0,0,0,.35);
        transition: transform .25s ease;
      }
      .floating-scroll-top:hover .floating-scroll-top__frame {
        filter: drop-shadow(0 12px 18px rgba(0,0,0,.55)) drop-shadow(0 0 20px rgba(217,169,154,.38)) brightness(1.1) saturate(1.1);
        transform: translateY(-2px);
      }
      .floating-scroll-top:hover .floating-scroll-top__icon { transform: translateY(-2px); }
      .floating-scroll-top:active .floating-scroll-top__frame { transform: scale(.965); filter: drop-shadow(0 4px 8px rgba(0,0,0,.55)) brightness(.9); }
      .floating-scroll-top:active .floating-scroll-top__icon { transform: scale(.97); }
      .floating-scroll-top:focus-visible {
        outline: 2px solid var(--rose, #d9a99a);
        outline-offset: 6px;
      }
      .floating-scroll-top.show {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0) scale(1);
      }
      @media (max-width: 575.98px) {
        .floating-scroll-top {
          right: calc(12px + env(safe-area-inset-right, 0px));
          bottom: calc(12px + env(safe-area-inset-bottom, 0px));
          width: 48px;
          height: 48px;
        }
        .floating-scroll-top__icon {
          width: 23px;
          height: 23px;
          font-size: 1.1rem;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .floating-scroll-top,
        .floating-scroll-top__frame,
        .floating-scroll-top__icon { transition: none; }
      }
    `;
    document.head.appendChild(style);
  }

  function createScrollTopButton(){
    if(document.querySelector(".floating-scroll-top"))return;
    ensureStyles();
    const button=document.createElement("button");
    button.type="button";
    button.className="floating-scroll-top";
    button.setAttribute("aria-label","Back to top");
    button.innerHTML=`
      <svg class="floating-scroll-top__frame" viewBox="0 0 220 220" aria-hidden="true">
        <defs>
          <linearGradient id="scroll-gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="220" y2="220"><stop offset="0" stop-color="#f7e2b4"/><stop offset=".35" stop-color="#d9b072"/><stop offset=".6" stop-color="#b98a4c"/><stop offset="1" stop-color="#8a5f33"/></linearGradient>
          <radialGradient id="scroll-face" cx=".4" cy=".32" r=".85"><stop offset="0" stop-color="#5a3646"/><stop offset=".6" stop-color="#2d1b25"/><stop offset="1" stop-color="#1a1017"/></radialGradient>
          <linearGradient id="scroll-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
          <clipPath id="scroll-face-clip"><circle cx="110" cy="110" r="76"/></clipPath>
          <filter id="scroll-soft" filterUnits="userSpaceOnUse" x="-10" y="-10" width="240" height="240"><feGaussianBlur stdDeviation="5"/></filter>
          <filter id="scroll-relief" filterUnits="userSpaceOnUse" x="-10" y="-10" width="240" height="240" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/><feDiffuseLighting in="blur" surfaceScale="4" diffuseConstant="1.3" lighting-color="#fff" result="diff"><feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting><feComposite in="diff" in2="SourceAlpha" operator="in" result="diffIn"/><feBlend in="SourceGraphic" in2="diffIn" mode="multiply" result="lit"/><feSpecularLighting in="blur" surfaceScale="4" specularConstant="1.2" specularExponent="26" lighting-color="#fff6dc" result="spec"><feDistantLight azimuth="225" elevation="45"/></feSpecularLighting><feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 .22 0 0 0 0 .13 0 0 0 0 .05 0 0 0 .5 -.08" result="grain"/><feComposite in="grain" in2="SourceAlpha" operator="in" result="grainIn"/><feMerge><feMergeNode in="lit"/><feMergeNode in="specIn"/><feMergeNode in="grainIn"/></feMerge></filter>
          <g id="scroll-mid" fill="none" stroke="url(#scroll-gold)" stroke-width="5" stroke-linecap="round"><path fill="url(#scroll-gold)" stroke="#6b4423" stroke-width=".9" d="M0,-16 C-8,-7 -8,5 0,13 C8,5 8,-7 0,-16Z"/><path d="M0,10 C-10,15 -22,9 -26,-3 C-28,-10 -20,-12 -18,-6"/><path d="M0,10 C10,15 22,9 26,-3 C28,-10 20,-12 18,-6"/></g>
          <g id="scroll-leaf"><path d="M0,0 C3,-9 15,-13 28,-8 C23,2 11,6 0,0Z" fill="url(#scroll-gold)" stroke="#6b4423" stroke-width=".9"/><path d="M2,-1 C10,-4 18,-6 25,-7" fill="none" stroke="#6b4423" stroke-width="1" opacity=".7"/></g>
          <g id="scroll-flower" stroke="#6b4423" stroke-width=".9" fill="url(#scroll-gold)"><ellipse cx="0" cy="-10" rx="4.6" ry="9"/><ellipse cx="0" cy="-10" rx="4.6" ry="9" transform="rotate(45)"/><ellipse cx="0" cy="-10" rx="4.6" ry="9" transform="rotate(90)"/><ellipse cx="0" cy="-10" rx="4.6" ry="9" transform="rotate(135)"/><ellipse cx="0" cy="-10" rx="4.6" ry="9" transform="rotate(180)"/><ellipse cx="0" cy="-10" rx="4.6" ry="9" transform="rotate(225)"/><ellipse cx="0" cy="-10" rx="4.6" ry="9" transform="rotate(270)"/><ellipse cx="0" cy="-10" rx="4.6" ry="9" transform="rotate(315)"/><circle r="3.2"/></g>
        </defs>
        <circle cx="110" cy="110" r="76" fill="url(#scroll-face)"/>
        <circle cx="110" cy="110" r="76" fill="url(#scroll-sheen)"/>
        <g filter="url(#scroll-relief)">
          <circle cx="110" cy="110" r="80" fill="none" stroke="url(#scroll-gold)" stroke-width="13"/>
          <circle cx="110" cy="110" r="90.5" fill="none" stroke="url(#scroll-gold)" stroke-width="5" stroke-linecap="round" pathLength="48" stroke-dasharray="0 1"/>
          <circle cx="110" cy="110" r="96.5" fill="none" stroke="url(#scroll-gold)" stroke-width="3.5"/>
          <use href="#scroll-mid" transform="translate(110 110) rotate(0) translate(0 -100) scale(.62)"/><use href="#scroll-mid" transform="translate(110 110) rotate(90) translate(0 -100) scale(.62)"/><use href="#scroll-mid" transform="translate(110 110) rotate(180) translate(0 -100) scale(.62)"/><use href="#scroll-mid" transform="translate(110 110) rotate(270) translate(0 -100) scale(.62)"/>
          <use href="#scroll-flower" transform="translate(110 110) rotate(45) translate(0 -98) scale(.62)"/><use href="#scroll-flower" transform="translate(110 110) rotate(135) translate(0 -98) scale(.62)"/><use href="#scroll-flower" transform="translate(110 110) rotate(225) translate(0 -98) scale(.62)"/><use href="#scroll-flower" transform="translate(110 110) rotate(315) translate(0 -98) scale(.62)"/>
          <use href="#scroll-leaf" transform="translate(110 110) rotate(22.5) translate(0 -97) scale(.5)"/><use href="#scroll-leaf" transform="translate(110 110) rotate(112.5) translate(0 -97) scale(.5)"/><use href="#scroll-leaf" transform="translate(110 110) rotate(202.5) translate(0 -97) scale(.5)"/><use href="#scroll-leaf" transform="translate(110 110) rotate(292.5) translate(0 -97) scale(.5)"/>
        </g>
      </svg>
      <span class="floating-scroll-top__icon" aria-hidden="true"><i class="bi bi-arrow-up"></i></span>`;
    document.body.appendChild(button);

    button.addEventListener("click",()=>{
      window.scrollTo({top:0,behavior:'smooth'});
    });

    function handleScroll(){
      if(window.scrollY>320){
        button.classList.add("show");
      }else{
        button.classList.remove("show");
      }
    }

    handleScroll();
    window.addEventListener('scroll',handleScroll,{passive:true});
  }

  function init(){
    if(!document.body){
      requestAnimationFrame(init);
      return;
    }
    applyDarkTheme();
    createScrollTopButton();
  }

  if(document.readyState==="complete"||document.readyState==="interactive"){
    init();
  }else{
    document.addEventListener("DOMContentLoaded",init);
  }
})();
