// Light/dark preference. The <head> inline script applies a stored choice
// before first paint; this file only wires the toggle button.
// v2: the previous site wrote 'dark' to 'thuscc-theme' on every visit, so that key
// cannot be trusted as a deliberate choice and is ignored.
const KEY = 'thuscc-theme-v2';
const root = document.documentElement;
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function resolved(): 'light' | 'dark' {
  const explicit = root.getAttribute('data-theme');
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return systemDark.matches ? 'dark' : 'light';
}

const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');

function updateLabels() {
  const label = resolved() === 'dark' ? '切换到浅色模式' : '切换到深色模式';
  buttons.forEach((b) => b.setAttribute('aria-label', label));
}

buttons.forEach((b) =>
  b.addEventListener('click', () => {
    const next = resolved() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    updateLabels();
  }),
);

systemDark.addEventListener('change', updateLabels);
updateLabels();
