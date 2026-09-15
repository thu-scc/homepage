// Member profile dialog: participation records come from a JSON block
// rendered at build time; profiles are addressable as /members#<pinyin>.
interface Participation {
  id: string;
  name: string;
  role: string;
  awards: string[];
  sortDate: string;
}

const dataEl = document.getElementById('member-data');
const dialog = document.getElementById('member-dialog') as HTMLDialogElement | null;

if (dataEl && dialog) {
  const { participation, slugs } = JSON.parse(dataEl.textContent || '{}') as {
    participation: Record<string, Participation[]>;
    slugs: Record<string, string>;
  };
  const nameBySlug = new Map(Object.entries(slugs).map(([name, slug]) => [slug, name]));

  const nameEl = dialog.querySelector<HTMLElement>('.dialog-name')!;
  const deptEl = dialog.querySelector<HTMLElement>('.dialog-dept')!;
  const urlEl = dialog.querySelector<HTMLAnchorElement>('.dialog-url')!;
  const bodyEl = dialog.querySelector<HTMLElement>('.dialog-body')!;

  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

  function renderRecords(records: Participation[]): string {
    if (records.length === 0) return '<p class="dialog-empty">No competition records yet.</p>';
    const groups = new Map<string, Participation[]>();
    for (const r of records) (groups.get(r.role) ?? groups.set(r.role, []).get(r.role)!).push(r);
    let html = '';
    for (const [role, items] of groups) {
      html += `<section class="dialog-group"><h3 class="dialog-role">${esc(role)} <span class="num">${items.length}</span></h3>`;
      for (const item of items) {
        const awards = item.awards.length ? `<span class="dialog-comp-awards">${esc(item.awards.join(', '))}</span>` : '';
        html += `<a class="dialog-comp" href="/competition/${encodeURIComponent(item.id)}"><span class="dialog-comp-name">${esc(item.name)}</span>${awards}</a>`;
      }
      html += '</section>';
    }
    return html;
  }

  function open(btn: HTMLElement) {
    const name = btn.dataset.name ?? '';
    const dept = btn.dataset.dept ?? '';
    const url = btn.dataset.url ?? '';
    const slug = btn.dataset.slug ?? '';

    nameEl.textContent = name;
    deptEl.textContent = dept;
    deptEl.hidden = !dept;
    if (url) {
      urlEl.href = url;
      urlEl.textContent = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      urlEl.hidden = false;
    } else {
      urlEl.hidden = true;
    }
    bodyEl.innerHTML = renderRecords(participation[name] ?? []);
    bodyEl.scrollTop = 0;

    if (!dialog!.open) dialog!.showModal();
    if (slug && location.hash !== `#${slug}`) history.replaceState(null, '', `#${slug}`);
  }

  document.querySelectorAll<HTMLElement>('.person-btn').forEach((btn) => {
    btn.addEventListener('click', () => open(btn));
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    if (location.hash) history.replaceState(null, '', location.pathname);
  });

  function openFromHash() {
    const slug = decodeURIComponent(location.hash.slice(1));
    if (!slug || !nameBySlug.has(slug)) return;
    const btn = document.querySelector<HTMLElement>(`.person-btn[data-slug="${CSS.escape(slug)}"]`);
    if (!btn) return;
    btn.closest('.person')?.scrollIntoView({ block: 'center' });
    open(btn);
  }

  openFromHash();
  window.addEventListener('hashchange', openFromHash);
}
