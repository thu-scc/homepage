// Quiet scroll-entry reveal for page sections below the fold. Sections are
// visible by default; the class only adds a short fade-up once, and only when
// the viewer has not asked for reduced motion.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');

if (!reduce && 'IntersectionObserver' in window && targets.length > 0) {
  document.documentElement.classList.add('reveal-ready');
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).classList.add('is-visible');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
  );
  targets.forEach((t) => {
    // Anything already on screen at load stays static; only later sections animate in.
    if (t.getBoundingClientRect().top < window.innerHeight * 0.9) t.classList.add('is-visible');
    else io.observe(t);
  });
}
