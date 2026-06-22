// ============ Theme System ============
const THEMES = ['dark', 'light', 'auto'];
const ICONS = {
  dark: '<path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/>',
  light: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.25v1.5m0 16.5v1.5m-9.75-9.75h1.5m16.5 0h1.5m-2.636-7.114-1.06 1.06m-11.668 11.668-1.06 1.06m14.788 0-1.06-1.06M6.166 6.166l-1.06-1.06"/>',
  auto: '<path d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z"/>'
};
const LABELS = { dark: 'Dark', light: 'Light', auto: 'Auto' };
let currentThemeIdx = 0;

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(mode) {
  const resolved = mode === 'auto' ? getSystemTheme() : mode;
  document.documentElement.setAttribute('data-theme', resolved);
  document.getElementById('themeIcon').innerHTML = ICONS[mode];
  document.getElementById('themeLabel').textContent = LABELS[mode];
  localStorage.setItem('thuscc-theme', mode);
}

(function initTheme() {
  const saved = localStorage.getItem('thuscc-theme');
  if (saved && THEMES.includes(saved)) currentThemeIdx = THEMES.indexOf(saved);
  applyTheme(THEMES[currentThemeIdx]);
})();

document.getElementById('themeBtn').addEventListener('click', () => {
  currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
  applyTheme(THEMES[currentThemeIdx]);
});

window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  if (THEMES[currentThemeIdx] === 'auto') applyTheme('auto');
});

// ============ SPA Router with Markdown Support ============
const pageContainer = document.getElementById('pageContainer');
const pageCache = {};

async function loadPage(name) {
  if (pageCache[name]) return pageCache[name];
  try {
    const resp = await fetch(`pages/${name}.md`);
    if (!resp.ok) throw new Error('Not found');
    const text = await resp.text();
    pageCache[name] = text;
    return text;
  } catch(e) {
    return null;
  }
}

function parseFrontMatter(md) {
  const match = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: md };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const [k, ...v] = line.split(':');
    if (k) meta[k.trim()] = v.join(':').trim();
  });
  return { meta, body: match[2] };
}

async function renderPage(name) {
  // Special: home page is inline in index.html
  if (name === 'home') {
    pageContainer.innerHTML = document.getElementById('tpl-home').innerHTML;
    return;
  }

  const md = await loadPage(name);
  if (!md) {
    pageContainer.innerHTML = '<section class="sec sec-top"><h2 class="sec-title">404</h2><p>页面不存在</p></section>';
    return;
  }

  const { meta, body } = parseFrontMatter(md);
  const html = marked.parse(body);

  let header = '';
  if (meta.kicker || meta.title || meta.lead) {
    header = `<section class="sec sec-top">`;
    if (meta.kicker) header += `<p class="sec-kicker">${meta.kicker}</p>`;
    if (meta.title) header += `<h2 class="sec-title">${meta.title}</h2>`;
    if (meta.lead) header += `<p class="sec-lead">${meta.lead}</p>`;
    header += `<div class="md-content">${html}</div></section>`;
  } else {
    header = `<section class="sec sec-top"><div class="md-content">${html}</div></section>`;
  }

  pageContainer.innerHTML = header;
}

function go(page) {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  window.scrollTo(0, 0);
  history.pushState(null, '', '#' + page);
  document.getElementById('navLinks')?.classList.remove('open');
  renderPage(page);
}

// Make go() globally accessible for onclick handlers
window.go = go;

document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', e => { e.preventDefault(); go(a.dataset.page); });
});
document.querySelector('.nav-logo').addEventListener('click', e => { e.preventDefault(); go('home'); });

function route() { go((location.hash.replace('#', '') || 'home')); }
window.addEventListener('hashchange', route);
window.addEventListener('popstate', route);
route();

// Mobile toggle
document.getElementById('navToggle')?.addEventListener('click', () => {
  document.getElementById('navLinks')?.classList.toggle('open');
});
