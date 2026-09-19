// Small-screen navigation disclosure. Handlers are delegated to the document so
// they survive client-side page transitions, where the header is swapped out.
const header = () => document.querySelector<HTMLElement>('[data-site-header]');
const toggle = () => document.querySelector<HTMLButtonElement>('[data-nav-toggle]');

function setOpen(open: boolean) {
  const h = header();
  const t = toggle();
  if (!h || !t) return;
  h.dataset.open = String(open);
  t.setAttribute('aria-expanded', String(open));
  t.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

document.addEventListener('click', (e) => {
  if (!(e.target instanceof Element)) return;
  const h = header();
  if (e.target.closest('[data-nav-toggle]')) {
    setOpen(h?.dataset.open !== 'true');
    return;
  }
  if (h?.dataset.open === 'true' && !h.contains(e.target)) setOpen(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && header()?.dataset.open === 'true') {
    setOpen(false);
    toggle()?.focus();
  }
});

window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
  if (e.matches) setOpen(false);
});

// Close the menu when a new page arrives.
document.addEventListener('astro:after-swap', () => setOpen(false));
