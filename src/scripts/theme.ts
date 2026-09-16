// Colour theme: system (default), light or dark. An explicit choice is stored
// under thuscc-theme-v2 and stamped on <html> as data-theme; "system" removes
// the attribute so the CSS follows prefers-color-scheme. The <head> inline
// script applies the stored choice before first paint; this file handles the
// control, keeps the choice across client-side page transitions (which reset
// the root element's attributes) and updates the browser chrome colour.
type Mode = 'system' | 'light' | 'dark';
const KEY = 'thuscc-theme-v2';
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function stored(): Mode {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function resolved(mode: Mode): 'light' | 'dark' {
  return mode === 'system' ? (systemDark.matches ? 'dark' : 'light') : mode;
}

function syncChrome(mode: Mode) {
  const color = resolved(mode) === 'dark' ? '#3a2647' : '#f6f3f8';
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    if (mode === 'system') m.content = m.dataset.default ?? m.content;
    else m.content = color;
  });
}

function syncButtons(mode: Mode) {
  document.querySelectorAll<HTMLButtonElement>('[data-theme-set]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.themeSet === mode));
  });
}

function apply(mode: Mode) {
  const root = document.documentElement;
  if (mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
  syncChrome(mode);
  syncButtons(mode);
}

document.addEventListener('click', (e) => {
  if (!(e.target instanceof Element)) return;
  const button = e.target.closest<HTMLElement>('[data-theme-set]');
  if (!button) return;
  const mode = (button.dataset.themeSet as Mode) ?? 'system';
  try {
    if (mode === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {}
  apply(mode);
});

// The swap replaces <html> attributes; put the choice back before the new page paints.
document.addEventListener('astro:after-swap', () => apply(stored()));
document.addEventListener('astro:page-load', () => {
  syncButtons(stored());
  syncChrome(stored());
});
systemDark.addEventListener('change', () => syncChrome(stored()));
