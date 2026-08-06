import type { NavChild, NavNode } from "@/lib/menu";

/* Draft-vs-live diff for menus.
 *
 * Publishing a menu changes every page at once, and the only signal before
 * this was a boolean "Unpublished changes" — which tells you something moved
 * but not what, so the safe habit became publishing blind and hoping.
 *
 * Snapshots carry no ids (itemsToTree emits label/href only), so identity is
 * matched by heuristic, in descending confidence:
 *   1. same parent + same href   (the usual case — an item was edited in place)
 *   2. same parent + same label  (its href was retargeted)
 *   3. same href anywhere        (it was dragged to a different parent)
 * Whatever is left over is a genuine add or removal. The heuristic can only
 * mislabel HOW something changed, never whether it did, so the summary is
 * always safe to trust as "these entries differ".
 */

export type DiffEntry = {
  label: string;
  href: string;
  /** Parent labels from the root, e.g. ["Services", "Growth"]. */
  path: string[];
  detail?: string;
};

export type MenuDiff = {
  added: DiffEntry[];
  removed: DiffEntry[];
  renamed: DiffEntry[];
  retargeted: DiffEntry[];
  moved: DiffEntry[];
  reordered: DiffEntry[];
  /** Total number of differing entries. 0 = draft matches live exactly. */
  total: number;
};

type Flat = {
  label: string;
  href: string;
  path: string[];
  parentKey: string;
  /** parentKey + own label — the identity a child's parentKey refers to. */
  fullPath: string;
  index: number;
};

function flatten(nodes: (NavNode | NavChild)[] | undefined): Flat[] {
  const out: Flat[] = [];
  const walk = (list: (NavNode | NavChild)[], path: string[], depth: number) => {
    if (depth > 10) return;
    list.forEach((n, index) => {
      const node = n as NavNode & NavChild;
      const parentKey = path.join(" > ");
      out.push({
        label: node.label,
        href: node.href,
        path: [...path],
        parentKey,
        fullPath: [...path, node.label].join(" > "),
        index,
      });
      if (node.children?.length) walk(node.children, [...path, node.label], depth + 1);
    });
  };
  walk(nodes ?? [], [], 0);
  return out;
}

const entry = (f: Flat, detail?: string): DiffEntry => ({
  label: f.label,
  href: f.href,
  path: f.path,
  ...(detail ? { detail } : {}),
});

export function diffMenus(
  live: (NavNode | NavChild)[] | undefined,
  draft: (NavNode | NavChild)[] | undefined,
): MenuDiff {
  const liveFlat = flatten(live);
  const draftFlat = flatten(draft);

  const usedLive = new Set<number>();
  const usedDraft = new Set<number>();
  const pairs: { l: Flat; d: Flat }[] = [];

  const match = (pick: (l: Flat, d: Flat) => boolean) => {
    draftFlat.forEach((d, di) => {
      if (usedDraft.has(di)) return;
      const li = liveFlat.findIndex((l, i) => !usedLive.has(i) && pick(l, d));
      if (li >= 0) {
        usedLive.add(li);
        usedDraft.add(di);
        pairs.push({ l: liveFlat[li], d });
      }
    });
  };

  // Confidence order matters: an in-place edit must be claimed before the
  // looser "same href anywhere" rule can steal it as a move.
  match((l, d) => l.parentKey === d.parentKey && l.href === d.href);
  match((l, d) => l.parentKey === d.parentKey && l.label === d.label);
  match((l, d) => l.href === d.href);

  /* Paths are label-based, so renaming a parent shifts every descendant's
     parentKey and would otherwise report the whole subtree as "moved" —
     renaming one item once produced "6 moved". Translate each live parent
     path through the renames actually observed before judging a move.
     Iterated so a rename several levels up still resolves. */
  const renames = pairs
    .filter((p) => p.l.fullPath !== p.d.fullPath)
    .map((p) => ({ from: p.l.fullPath, to: p.d.fullPath }));

  const translate = (key: string): string => {
    let out = key;
    for (let pass = 0; pass < 5; pass++) {
      let changed = false;
      for (const { from, to } of renames) {
        if (out === from) {
          out = to;
          changed = true;
        } else if (out.startsWith(`${from} > `)) {
          out = to + out.slice(from.length);
          changed = true;
        }
      }
      if (!changed) break;
    }
    return out;
  };

  const renamed: DiffEntry[] = [];
  const retargeted: DiffEntry[] = [];
  const moved: DiffEntry[] = [];
  const reordered: DiffEntry[] = [];

  for (const { l, d } of pairs) {
    if (translate(l.parentKey) !== d.parentKey) {
      moved.push(entry(d, `from ${l.parentKey || "top level"} to ${d.parentKey || "top level"}`));
      continue; // a move already implies its position changed
    }
    if (l.label !== d.label) renamed.push(entry(d, `was "${l.label}"`));
    if (l.href !== d.href) retargeted.push(entry(d, `was ${l.href}`));
    if (l.label === d.label && l.href === d.href && l.index !== d.index) {
      reordered.push(entry(d, `position ${l.index + 1} → ${d.index + 1}`));
    }
  }

  const added = draftFlat.filter((_, i) => !usedDraft.has(i)).map((f) => entry(f));
  const removed = liveFlat.filter((_, i) => !usedLive.has(i)).map((f) => entry(f));

  return {
    added,
    removed,
    renamed,
    retargeted,
    moved,
    reordered,
    total:
      added.length +
      removed.length +
      renamed.length +
      retargeted.length +
      moved.length +
      reordered.length,
  };
}

/** Compact human summary, e.g. "3 added · 1 removed · 2 moved". */
export function summariseDiff(d: MenuDiff): string {
  const parts: string[] = [];
  if (d.added.length) parts.push(`${d.added.length} added`);
  if (d.removed.length) parts.push(`${d.removed.length} removed`);
  if (d.renamed.length) parts.push(`${d.renamed.length} renamed`);
  if (d.retargeted.length) parts.push(`${d.retargeted.length} retargeted`);
  if (d.moved.length) parts.push(`${d.moved.length} moved`);
  if (d.reordered.length) parts.push(`${d.reordered.length} reordered`);
  return parts.join(" · ") || "No differences";
}
