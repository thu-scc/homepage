// Small-screen navigation disclosure.
const header = document.querySelector<HTMLElement>('[data-site-header]');
const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');

function setOpen(open: boolean) {
  if (!header || !toggle) return;
  header.dataset.open = String(open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

toggle?.addEventListener('click', () => setOpen(header?.dataset.open !== 'true'));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && header?.dataset.open === 'true') {
    setOpen(false);
    toggle?.focus();
  }
});

document.addEventListener('click', (e) => {
  if (header?.dataset.open === 'true' && e.target instanceof Node && !header.contains(e.target)) setOpen(false);
});

window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
  if (e.matches) setOpen(false);
});
