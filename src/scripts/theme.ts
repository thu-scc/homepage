// Theme System
const THEMES = ['dark', 'light', 'auto'] as const;
const ICONS: Record<string, string> = {
  dark: '<path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/>',
  light: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.25v1.5m0 16.5v1.5m-9.75-9.75h1.5m16.5 0h1.5m-2.636-7.114-1.06 1.06m-11.668 11.668-1.06 1.06m14.788 0-1.06-1.06M6.166 6.166l-1.06-1.06"/>',
  auto: '<path d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z"/>'
};
const LABELS: Record<string, string> = { dark: 'Dark', light: 'Light', auto: 'Auto' };
let currentThemeIdx = 0;

function getSystemTheme(): string {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(mode: string) {
  const resolved = mode === 'auto' ? getSystemTheme() : mode;
  document.documentElement.setAttribute('data-theme', resolved);
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (icon) icon.innerHTML = ICONS[mode];
  if (label) label.textContent = LABELS[mode];
  localStorage.setItem('thuscc-theme', mode);
}

// Init
const saved = localStorage.getItem('thuscc-theme');
if (saved && THEMES.includes(saved as any)) currentThemeIdx = THEMES.indexOf(saved as any);
applyTheme(THEMES[currentThemeIdx]);

document.getElementById('themeBtn')?.addEventListener('click', () => {
  currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
  applyTheme(THEMES[currentThemeIdx]);
});

window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  if (THEMES[currentThemeIdx] === 'auto') applyTheme('auto');
});
