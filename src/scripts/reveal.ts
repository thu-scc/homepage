// Quiet scroll-entry reveal for page sections below the fold, plus a count-up
// for figures marked data-count. Sections are visible by default; the class
// only adds a short fade-up once. Nothing runs when the viewer has asked for
// reduced motion. Re-initialised after every client-side page transition.
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;
  const duration = 900;
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function init() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  const counters = document.querySelectorAll<HTMLElement>('[data-count]');
  if (reduce() || !('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('is-visible'));
    return;
  }
  document.documentElement.classList.add('reveal-ready');

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        entry.target.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
  );

  const show = (t: Element) => {
    if (t.classList.contains('is-visible')) return;
    t.classList.add('is-visible');
    t.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
    io.unobserve(t);
  };
  const inView = (t: Element) => t.getBoundingClientRect().top < window.innerHeight * 0.9;

  targets.forEach((t) => {
    // Anything already on screen at load stays static; only later sections animate in.
    if (inView(t)) show(t);
    else io.observe(t);
  });

  // Safety net: if intersection reports are delayed (a document that was hidden
  // while loading, an embedded webview), reveal whatever is in view by geometry.
  const sweep = () => targets.forEach((t) => inView(t) && show(t));
  document.addEventListener('visibilitychange', sweep, { once: true });
  window.setTimeout(sweep, 2500);

  // Counters outside a revealed section start at once.
  counters.forEach((c) => {
    if (!c.closest('[data-reveal]')) countUp(c);
  });
}

document.addEventListener('astro:page-load', init);
