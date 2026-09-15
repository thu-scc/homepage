import data from '../data/competitions.json';
import detailsJson from '../data/competition-details.json';

export type ResultType =
  | 'champion'
  | 'runner-up'
  | 'linpack'
  | 'eprize'
  | 'special'
  | 'place'
  | 'notHeld'
  | 'absent';

export interface ResultEntry {
  type: ResultType;
  label: string;
  /** Key into competition-details.json; entries without an id have no detail page. */
  id?: string;
  note?: string;
}

export type YearRecord = { year: number } & Record<string, number | ResultEntry[]>;

export type TeamRole = 'coaches' | 'players' | 'support' | 'training';

export interface CompetitionDetail {
  name: string;
  date?: string;
  location?: string;
  awards: string[];
  team?: Partial<Record<TeamRole, string[]>>;
  problems?: string[];
  news?: { title: string; url: string }[];
  photos?: string[];
  highlights?: string;
  /** YYYY-MM, used for ordering when `date` is imprecise. */
  sortDate?: string;
  _notes?: string;
}

export const columns = data.competitions as string[];
export const grandSlamYears = data.grandSlamYears as number[];
/** Newest year first, as stored. */
export const records = data.records as YearRecord[];
export const details = detailsJson as Record<string, CompetitionDetail>;

export const roleOrder: TeamRole[] = ['coaches', 'players', 'support', 'training'];
export const roleLabels: Record<TeamRole, string> = {
  coaches: 'Coaches',
  players: 'Competing team',
  support: 'Technical support',
  training: 'Training squad',
};

export function entriesFor(row: YearRecord, column: string): ResultEntry[] {
  const value = row[column];
  return Array.isArray(value) ? value : [];
}

export const championCount = records.reduce(
  (sum, row) =>
    sum + columns.reduce((s, col) => s + entriesFor(row, col).filter((e) => e.type === 'champion').length, 0),
  0,
);

export const championYears = new Set(
  records.filter((row) => columns.some((col) => entriesFor(row, col).some((e) => e.type === 'champion'))).map((r) => r.year),
);

export const firstYear = records[records.length - 1].year;
export const latestYear = records[0].year;
export const yearsOfHistory = latestYear - firstYear + 1;

export interface RecentResult {
  id: string;
  year: number;
  column: string;
  name: string;
  entries: ResultEntry[];
  sortDate: string;
}

/** Results with a detail page, newest first, grouped by competition id. */
export function recentResults(limit = 4): RecentResult[] {
  const byId = new Map<string, RecentResult>();
  for (const row of records) {
    for (const column of columns) {
      for (const entry of entriesFor(row, column)) {
        if (!entry.id || entry.type === 'notHeld' || entry.type === 'absent') continue;
        const detail = details[entry.id];
        const existing = byId.get(entry.id);
        if (existing) {
          existing.entries.push(entry);
          continue;
        }
        byId.set(entry.id, {
          id: entry.id,
          year: row.year,
          column,
          name: detail?.name ?? `${column} ${row.year}`,
          entries: [entry],
          sortDate: detail?.sortDate ?? detail?.date?.slice(0, 7) ?? `${row.year}-00`,
        });
      }
    }
  }
  return [...byId.values()].sort((a, b) => b.sortDate.localeCompare(a.sortDate)).slice(0, limit);
}

export function sortDateOf(id: string, detail: CompetitionDetail): string {
  if (detail.sortDate) return detail.sortDate;
  if (detail.date) return detail.date.slice(0, 7);
  const year = id.match(/\d{2}/)?.[0];
  return year ? `20${year}-00` : '0000-00';
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** Small integers as English words for running copy, e.g. 19 → "nineteen". */
export function numberWords(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
  return String(n);
}
