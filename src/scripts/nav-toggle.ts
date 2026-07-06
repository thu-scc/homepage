// Mobile/tablet navigation toggle.
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function setMenuOpen(open: boolean) {
  navLinks?.classList.toggle('open', open);
  navToggle?.setAttribute('aria-expanded', String(open));
  navToggle?.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
}

navToggle?.addEventListener('click', () => {
  setMenuOpen(!navLinks?.classList.contains('open'));
});

navLinks?.querySelectorAll('a')?.forEach(link => {
  link.addEventListener('click', () => setMenuOpen(false));
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 1024) setMenuOpen(false);
});
