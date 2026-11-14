(() => {
  const nav = document.querySelector("[data-resizable-nav]");
  if (!nav) return;

  const menu = nav.querySelector(".navbar-collapse");
  const links = Array.from(nav.querySelectorAll("a.nav-link[href]"));
  const sectionLinks = links.map(link => {
    try {
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return null;
      const section = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      return section ? { link, section } : null;
    } catch {
      return null;
    }
  }).filter(Boolean);
  let activeFrame = 0;

  function setActiveLink(activeLink) {
    links.forEach(link => {
      const isActive = link === activeLink;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function syncScrollState() {
    nav.classList.toggle("is-scrolled", window.scrollY > 100);
  }

  function closeMobileMenu() {
    if (!menu || !menu.classList.contains("show") || !window.bootstrap) return;
    window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
  }

  function syncActiveSection() {
    if (!sectionLinks.length) return;
    activeFrame = 0;
    const marker = Math.min(window.innerHeight * .36, window.innerHeight - 80);
    const current = sectionLinks.find(({ section }) => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= marker && bounds.bottom > marker;
    });
    let selected = current;
    if (!selected && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      selected = sectionLinks[sectionLinks.length - 1];
    }
    if (!selected) {
      const previous = sectionLinks.filter(({ section }) => section.getBoundingClientRect().bottom <= marker).at(-1);
      selected = previous || sectionLinks.find(({ section }) => section.getBoundingClientRect().top > marker) || sectionLinks[0];
    }
    if (selected) setActiveLink(selected.link);
  }

  function scheduleActiveSection() {
    if (activeFrame) return;
    activeFrame = window.requestAnimationFrame(syncActiveSection);
  }

  syncScrollState();
  window.addEventListener("scroll", syncScrollState, { passive: true });
  if (sectionLinks.length) {
    syncActiveSection();
    window.addEventListener("scroll", scheduleActiveSection, { passive: true });
    window.addEventListener("resize", scheduleActiveSection, { passive: true });
    window.addEventListener("hashchange", scheduleActiveSection);
  }
  nav.querySelectorAll("a.nav-link:not(.nav-theme-toggle)").forEach(link => {
    link.addEventListener("click", closeMobileMenu);
  });
})();
