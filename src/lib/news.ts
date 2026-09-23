import postsJson from '../data/news.json';
import { details, sortDateOf } from './competitions';

export interface NewsItem {
  /** YYYY-MM-DD for a team post, YYYY-MM for press coverage dated to its competition. */
  date: string;
  title: string;
  summary?: string;
  url?: string;
  /** Outlet or platform, shown beside the date. */
  source: string;
  kind: 'post' | 'press';
  /** Set on press coverage so the row can link to the event it covers. */
  competitionId?: string;
}

/** Outlets the team has been covered by, keyed by host. */
const OUTLETS: Record<string, string> = {
  'www.tsinghua.edu.cn': 'Tsinghua University',
  'www.cs.tsinghua.edu.cn': 'Department of Computer Science',
  'tech.gmw.cn': 'Guangming Daily',
  'news.sciencenet.cn': 'Science Net',
  'ur.tencent.com': 'Tencent',
  'innull.com': 'Member blog',
  'mp.weixin.qq.com': 'WeChat',
};

/** "https://sc23.supercomputing.org/..." → "SC23"; unknown hosts keep their domain. */
function outletFor(url: string): string {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return 'Link';
  }
  if (OUTLETS[host]) return OUTLETS[host];
  const conference = host.match(/^(sc|isc|asc)(\d{2})\./i);
  if (conference) return `${conference[1].toUpperCase()}${conference[2]}`;
  return host.replace(/^www\./, '');
}

/** Press coverage already names its outlet in parentheses; the column says it now. */
function trimOutlet(title: string, outlet: string): string {
  const suffix = ` (${outlet})`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

/** Hand-written posts from the team's WeChat account, newest first. */
export const posts: NewsItem[] = (postsJson as Omit<NewsItem, 'kind'>[]).map((p) => ({ ...p, kind: 'post' }));

/** Every press link recorded on a competition, dated to that competition. */
export const press: NewsItem[] = Object.entries(details).flatMap(([id, detail]) =>
  (detail.news ?? []).map((item) => {
    const source = outletFor(item.url);
    return {
      date: sortDateOf(id, detail),
      title: trimOutlet(item.title, source),
      url: item.url,
      source,
      kind: 'press' as const,
      competitionId: id,
    };
  }),
);

/** Team posts and press coverage in one feed, newest first. */
export const allNews: NewsItem[] = [...posts, ...press].sort((a, b) => b.date.localeCompare(a.date));

/**
 * The newest items for the home page. Press coverage is thinned to one story per
 * competition so a single event cannot fill the list.
 */
export function recentNews(limit = 4): NewsItem[] {
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const item of allNews) {
    if (item.competitionId) {
      if (seen.has(item.competitionId)) continue;
      seen.add(item.competitionId);
    }
    items.push(item);
    if (items.length === limit) break;
  }
  return items;
}

/** The whole feed grouped into years, newest year first. */
export function newsByYear(): { year: string; items: NewsItem[] }[] {
  const years = new Map<string, NewsItem[]>();
  for (const item of allNews) {
    const year = item.date.slice(0, 4);
    const bucket = years.get(year);
    if (bucket) bucket.push(item);
    else years.set(year, [item]);
  }
  return [...years.entries()].map(([year, items]) => ({ year, items }));
}

export const newsCount = allNews.length;
