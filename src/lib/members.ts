import membersJson from '../data/members.json';
import { pinyin } from 'pinyin-pro';
import { details, roleLabels, roleOrder, sortDateOf } from './competitions';

export interface Person {
  name: string;
  /** Department; omitted means 计算机系. */
  dept?: string;
  /** Academic title, advisors only. */
  title?: string;
  url?: string;
}

export interface GradeGroup {
  grade: string;
  members: Person[];
}

export const advisors = {
  current: membersJson.advisors.current as Person[],
  former: membersJson.advisors.former as string[],
};
export const activeGroups = membersJson.active as GradeGroup[];
export const alumniGroups = membersJson.alumni as GradeGroup[];

export const memberCount =
  activeGroups.reduce((n, g) => n + g.members.length, 0) + alumniGroups.reduce((n, g) => n + g.members.length, 0);

/** URL-safe pinyin slug, e.g. 翟季冬 → zhaijidong. */
export function toSlug(name: string): string {
  return pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
}

const allNames = [
  ...advisors.current.map((p) => p.name),
  ...advisors.former,
  ...activeGroups.flatMap((g) => g.members.map((p) => p.name)),
  ...alumniGroups.flatMap((g) => g.members.map((p) => p.name)),
];

export const slugByName: Record<string, string> = Object.fromEntries(allNames.map((n) => [n, toSlug(n)]));

export interface Participation {
  id: string;
  name: string;
  role: string;
  awards: string[];
  sortDate: string;
}

/**
 * Reverse index built from the `team` lists in competition-details.json.
 * Names must match members.json character for character.
 */
export const participationByName: Record<string, Participation[]> = {};
for (const [id, detail] of Object.entries(details)) {
  if (!detail.team) continue;
  const sortDate = sortDateOf(id, detail);
  for (const role of roleOrder) {
    for (const person of detail.team[role] ?? []) {
      (participationByName[person] ??= []).push({
        id,
        name: detail.name,
        role: roleLabels[role],
        awards: detail.awards ?? [],
        sortDate,
      });
    }
  }
}
for (const list of Object.values(participationByName)) {
  list.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}

/** Link target for a name if it belongs to a listed member, otherwise undefined. */
export function memberHref(name: string): string | undefined {
  const slug = slugByName[name];
  return slug ? `/members#${slug}` : undefined;
}
