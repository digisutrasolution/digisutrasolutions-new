"use client";

import { withBase } from "@/lib/base-path";

import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  GripVertical,
  History,
  Pencil,
  Plus,
  Rocket,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
  Link2 as LinkIcon,
} from "lucide-react";
import { NAV_ICONS, navIcon } from "@/components/nav-icons";
import { MENU_LOCATIONS, type MenuLocation } from "@/lib/menu-locations";

type Item = {
  id: string;
  parentId: string | null;
  label: string;
  href: string;
  icon: string | null;
  group: string | null;
  badge: string | null;
  description: string | null;
  order: number;
  visible: boolean;
  newTab: boolean;
  panelImage: string | null;
  tagline: string | null;
  featured: boolean;
  deletedAt?: string | null;
};

type Version = { id: string; authorName: string | null; createdAt: string };
type LinkTarget = { label: string; href: string };
type LinkGroup = { label: string; items: LinkTarget[] };

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100";
const labelCls =
  "mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400";
const toolBtn =
  "flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-400 dark:border-stone-700 dark:text-stone-300";

function Toggle({
  on,
  onClick,
  title,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={on}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
        on ? "bg-emerald-600" : "bg-stone-300 dark:bg-stone-700"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
          on ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

/* Inline edit form for one item. Depth decides which fields apply: panel
   fields belong to HEADER top-level items, link decoration to sub-items. */
function ItemForm({
  item,
  depth,
  location,
  linkGroups,
  onSaved,
  onCancel,
}: {
  item: Partial<Item> & { parentId: string | null };
  depth: number;
  location: MenuLocation;
  linkGroups: LinkGroup[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isNew = !item.id;
  const isTop = depth === 0;
  const showPanelFields = isTop && location === "HEADER";
  const [f, setF] = useState({
    label: item.label ?? "",
    href: item.href ?? "/",
    icon: item.icon ?? "",
    group: item.group ?? "",
    badge: item.badge ?? "",
    description: item.description ?? "",
    panelImage: item.panelImage ?? "",
    tagline: item.tagline ?? "",
    featured: item.featured ?? false,
    newTab: item.newTab ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const known = useMemo(
    () => new Set(linkGroups.flatMap((g) => g.items.map((i) => i.href))),
    [linkGroups],
  );
  const internal = f.href.startsWith("/") && !f.href.includes("#");
  const unknownTarget = internal && f.href.length > 1 && !known.has(f.href);

  const save = async () => {
    setBusy(true);
    setErr("");
    const payload = {
      label: f.label,
      href: f.href,
      icon: f.icon || null,
      group: f.group || null,
      badge: f.badge || null,
      description: f.description || null,
      panelImage: f.panelImage || null,
      tagline: f.tagline || null,
      featured: f.featured,
      newTab: f.newTab,
      ...(isNew ? { parentId: item.parentId, location } : {}),
    };
    try {
      const res = await fetch(
        withBase(isNew ? "/api/menus" : `/api/menus/${item.id}`),
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-2 mb-2 rounded-xl border border-orange-200 bg-orange-50/40 p-4 dark:border-orange-900/50 dark:bg-stone-900">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Label</label>
          <input value={f.label} onChange={(e) => set("label", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Link</label>
          <input
            value={f.href}
            onChange={(e) => set("href", e.target.value)}
            className={inputCls}
            list="menu-link-targets"
            placeholder="/services/seo — or pick a page"
          />
          {unknownTarget && (
            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
              No published page, service or post matches this path — double-check it.
            </p>
          )}
        </div>
        {!isTop && (
          <>
            <div>
              <label className={labelCls}>Icon</label>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800">
                  {createElement(navIcon(f.icon || undefined), { size: 16 })}
                </span>
                <select value={f.icon} onChange={(e) => set("icon", e.target.value)} className={inputCls}>
                  <option value="">— none —</option>
                  {Object.keys(NAV_ICONS).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Group (column heading)</label>
              <input value={f.group} onChange={(e) => set("group", e.target.value)} className={inputCls} placeholder="Marketing" />
            </div>
            <div>
              <label className={labelCls}>Badge</label>
              <input value={f.badge} onChange={(e) => set("badge", e.target.value)} className={inputCls} placeholder="NEW / HOT" maxLength={12} />
            </div>
            <div>
              <label className={labelCls}>Description (shown under the label)</label>
              <input value={f.description} onChange={(e) => set("description", e.target.value)} className={inputCls} placeholder="One short line" maxLength={200} />
            </div>
          </>
        )}
        {showPanelFields && (
          <>
            <div>
              <label className={labelCls}>Panel image URL</label>
              <input value={f.panelImage} onChange={(e) => set("panelImage", e.target.value)} className={inputCls} placeholder="/menu-images/… (copy from Media)" />
            </div>
            <div>
              <label className={labelCls}>Tagline (panel caption)</label>
              <input value={f.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} />
            </div>
          </>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {showPanelFields && (
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-300">
            <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />
            Show latest Journal post card
          </label>
        )}
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-300">
          <input type="checkbox" checked={f.newTab} onChange={(e) => set("newTab", e.target.checked)} />
          Open in new tab
        </label>
        <div className="ml-auto flex items-center gap-2">
          {err && <span className="text-xs text-red-600">{err}</span>}
          <button onClick={onCancel} className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy || !f.label.trim() || !f.href.trim()}
            className="cursor-pointer rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : isNew ? "Add item" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenusManager() {
  const [location, setLocation] = useState<MenuLocation>("HEADER");
  const [items, setItems] = useState<Item[]>([]);
  const [trash, setTrash] = useState<Item[]>([]);
  const [dirty, setDirty] = useState(false);
  /* Link health, keyed by item id — empty until a check is run. */
  const [linkHealth, setLinkHealth] = useState<Map<string, { status: string; note?: string }>>(new Map());
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null); // item id or "new:<parentId|top>"
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [linkGroups, setLinkGroups] = useState<LinkGroup[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    const res = await fetch(withBase(`/api/menus?location=${location}`));
    const data = await res.json();
    if (data.ok) {
      setItems(data.items);
      setTrash(data.trash ?? []);
      setDirty(data.dirty);
    }
    setLoading(false);
  }, [location]);

  useEffect(() => {
    // Defer past the first paint — repo convention for initial fetches.
    const t = setTimeout(() => {
      setLoading(true);
      setVersions(null);
      setEditing(null);
      setSelected(new Set());
      void reload();
    }, 0);
    return () => clearTimeout(t);
  }, [reload]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(withBase("/api/menus/link-targets"));
      const data = await res.json().catch(() => ({}));
      if (data.ok) setLinkGroups(data.groups);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const childrenOf = useCallback(
    (id: string | null) =>
      items.filter((i) => (i.parentId ?? null) === id).sort((a, b) => a.order - b.order),
    [items],
  );

  /* Ancestor labels, so search results still say where an item lives. */
  const pathOf = useCallback(
    (item: Item) => {
      const parts: string[] = [];
      let cur = item.parentId ? items.find((i) => i.id === item.parentId) : null;
      for (let i = 0; i < 12 && cur; i++) {
        parts.unshift(cur.label);
        cur = cur.parentId ? items.find((x) => x.id === cur!.parentId) : null;
      }
      return parts;
    },
    [items],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return items
      .filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.href.toLowerCase().includes(q) ||
          (i.group ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items, query]);

  const patch = async (id: string, body: object) => {
    const res = await fetch(withBase(`/api/menus/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) setNotice(data.error ?? "Update failed.");
    await reload();
  };

  const subtreeCount = useCallback(
    (id: string): number => {
      let n = 0;
      const walk = (pid: string, depth: number) => {
        if (depth > 12) return;
        for (const c of items.filter((i) => i.parentId === pid)) {
          n++;
          walk(c.id, depth + 1);
        }
      };
      walk(id, 0);
      return n;
    },
    [items],
  );

  const remove = async (item: Item) => {
    const kids = subtreeCount(item.id);
    if (!confirm(`Move "${item.label}"${kids ? ` and its ${kids} sub-items` : ""} to the trash?`)) return;
    await fetch(withBase(`/api/menus/${item.id}`), { method: "DELETE" });
    setSelected(new Set());
    await reload();
  };

  const onDrop = async (target: Item) => {
    setDropTarget(null);
    if (!dragId || dragId === target.id) return;
    const dragged = items.find((i) => i.id === dragId);
    setDragId(null);
    if (!dragged) return;

    if ((dragged.parentId ?? null) === (target.parentId ?? null)) {
      // Same level: reorder.
      const siblings = childrenOf(target.parentId).filter((i) => i.id !== dragged.id);
      const idx = siblings.findIndex((s) => s.id === target.id);
      await patch(dragged.id, { moveTo: idx < 0 ? siblings.length : idx });
      return;
    }

    // Different level: dropping onto a branch nests inside it; dropping onto
    // a leaf makes the item its sibling.
    const targetHasKids = items.some((i) => i.parentId === target.id);
    if (targetHasKids) {
      await patch(dragged.id, { parentId: target.id });
      setExpanded((s) => new Set(s).add(target.id));
      return;
    }
    const siblings = childrenOf(target.parentId).filter((i) => i.id !== dragged.id);
    const idx = siblings.findIndex((s) => s.id === target.id);
    await patch(dragged.id, {
      parentId: target.parentId,
      moveTo: idx < 0 ? siblings.length : idx,
    });
  };

  const checkLinks = async () => {
    setChecking(true);
    setNotice("");
    try {
      const res = await fetch(withBase("/api/menus/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      });
      const data = await res.json();
      if (!data.ok) {
        setNotice(data.error ?? "Link check failed.");
        return;
      }
      const map = new Map<string, { status: string; note?: string }>();
      for (const r of data.results) map.set(r.id, { status: r.status, note: r.note });
      setLinkHealth(map);
      const { broken, redirect, checked } = data.summary;
      setNotice(
        broken
          ? `${broken} broken link${broken === 1 ? "" : "s"} of ${checked} — see the red markers.`
          : redirect
            ? `No broken links. ${redirect} redirect${redirect === 1 ? "" : "s"} — worth pointing straight at the target.`
            : `All ${checked} links resolve.`,
      );
    } catch {
      setNotice("Link check failed.");
    } finally {
      setChecking(false);
    }
  };

  const duplicate = async (item: Item) => {
    const res = await fetch(withBase(`/api/menus/${item.id}/duplicate`), { method: "POST" });
    const data = await res.json();
    if (!data.ok) setNotice(data.error ?? "Duplicate failed.");
    else setNotice(`Duplicated "${item.label}" — the copy starts hidden.`);
    await reload();
  };

  const bulk = async (action: "show" | "hide" | "trash") => {
    if (selected.size === 0) return;
    if (action === "trash" && !confirm(`Move ${selected.size} selected item(s) and their sub-items to the trash?`)) return;
    const res = await fetch(withBase("/api/menus/bulk"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, ids: [...selected], action }),
    });
    const data = await res.json();
    setNotice(data.ok ? `${data.affected} item(s) updated.` : data.error ?? "Bulk action failed.");
    setSelected(new Set());
    await reload();
  };

  const restoreItem = async (item: Item) => {
    const res = await fetch(withBase(`/api/menus/${item.id}/trash`), { method: "POST" });
    const data = await res.json();
    setNotice(
      data.ok
        ? `Restored "${item.label}"${data.reparented ? " at the top level (its parent is still in the trash)" : ""}.`
        : data.error ?? "Restore failed.",
    );
    await reload();
  };

  const purgeItem = async (item: Item) => {
    if (!confirm(`Permanently delete "${item.label}" and anything under it? This can't be undone.`)) return;
    await fetch(withBase(`/api/menus/${item.id}/trash`), { method: "DELETE" });
    await reload();
  };

  const importJson = async (file: File) => {
    const mode = confirm(
      "OK = REPLACE this menu's draft with the file.\nCancel = APPEND the file's items to the current draft.",
    )
      ? "replace"
      : "append";
    try {
      const parsed = JSON.parse(await file.text());
      const tree = Array.isArray(parsed) ? parsed : parsed.tree;
      const res = await fetch(withBase("/api/menus/io"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, mode, tree }),
      });
      const data = await res.json();
      setNotice(
        data.ok
          ? `Imported ${data.imported} item(s) (${mode}). Review, then publish.`
          : data.error ?? "Import failed.",
      );
      await reload();
    } catch {
      setNotice("That file isn't valid menu JSON.");
    }
  };

  const publish = async () => {
    setPublishing(true);
    setNotice("");
    const res = await fetch(withBase("/api/menus/publish"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location }),
    });
    const data = await res.json();
    setPublishing(false);
    if (data.ok) {
      setDirty(false);
      setNotice("Published — the live site is now serving this menu.");
    } else {
      setNotice(data.error ?? "Publish failed.");
    }
  };

  const loadVersions = async () => {
    if (versions) {
      setVersions(null);
      return;
    }
    const res = await fetch(withBase(`/api/menus/versions?location=${location}`));
    const data = await res.json();
    if (data.ok) setVersions(data.versions);
  };

  const restore = async (id: string) => {
    if (!confirm("Restore this version? It replaces both the draft and the live menu.")) return;
    const res = await fetch(withBase("/api/menus/versions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId: id }),
    });
    const data = await res.json();
    if (data.ok) {
      setVersions(null);
      setNotice("Version restored and published.");
      await reload();
    } else setNotice(data.error ?? "Restore failed.");
  };

  const dragProps = (item: Item) => ({
    draggable: !query,
    onDragStart: () => setDragId(item.id),
    onDragEnd: () => {
      setDragId(null);
      setDropTarget(null);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDropTarget(item.id);
    },
    onDrop: () => void onDrop(item),
  });

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  /* One row plus its subtree — recursion is what makes depth unlimited. */
  const renderRow = (item: Item, depth: number, searchMode = false): React.ReactNode => {
    const kids = childrenOf(item.id);
    const isOpen = expanded.has(item.id);
    const isTop = depth === 0;
    const path = searchMode ? pathOf(item) : [];
    return (
      <div key={item.id}>
        <div
          {...(searchMode ? {} : dragProps(item))}
          className={`flex items-center gap-2 rounded-lg px-2 ${isTop ? "py-2" : "py-1.5"} ${
            dropTarget === item.id && dragId && dragId !== item.id
              ? "bg-orange-50 outline outline-1 outline-dashed outline-orange-400 dark:bg-stone-800"
              : ""
          } ${!item.visible ? "opacity-50" : ""}`}
        >
          <input
            type="checkbox"
            checked={selected.has(item.id)}
            onChange={() => toggleSelect(item.id)}
            aria-label={`Select ${item.label}`}
            className="shrink-0 cursor-pointer"
          />
          {!searchMode && (
            <GripVertical size={isTop ? 15 : 14} className="shrink-0 cursor-grab text-stone-300 dark:text-stone-600" />
          )}
          {kids.length > 0 && !searchMode ? (
            <button
              onClick={() =>
                setExpanded((s) => {
                  const n = new Set(s);
                  if (n.has(item.id)) n.delete(item.id);
                  else n.add(item.id);
                  return n;
                })
              }
              className="cursor-pointer text-stone-400"
              aria-label={isOpen ? "Collapse" : "Expand"}
            >
              {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
          ) : (
            !searchMode && <span className="w-[15px] shrink-0" aria-hidden />
          )}
          {!isTop && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-500 dark:bg-stone-800">
              {createElement(navIcon(item.icon ?? undefined), { size: 13 })}
            </span>
          )}
          <span
            className={
              isTop
                ? "font-semibold text-stone-900 dark:text-stone-100"
                : "text-sm font-medium text-stone-800 dark:text-stone-200"
            }
          >
            {item.label}
          </span>
          {item.badge && (
            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-900 dark:bg-orange-900/40 dark:text-orange-200">
              {item.badge}
            </span>
          )}
          <span className="hidden truncate text-xs text-stone-400 sm:inline">
            {searchMode && path.length > 0 ? `${path.join(" › ")} › ` : ""}
            {item.href}
            {kids.length ? ` · ${kids.length} ${kids.length === 1 ? "item" : "items"}` : ""}
            {item.featured ? " · journal card" : ""}
          </span>
          {(() => {
            const h = linkHealth.get(item.id);
            if (!h || h.status === "ok" || h.status === "external") return null;
            const tone =
              h.status === "broken"
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
            return (
              <span
                title={h.note ?? ""}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${tone}`}
              >
                {h.status}
              </span>
            );
          })()}
          {!item.visible && <span className="text-[10px] font-bold text-stone-400">HIDDEN</span>}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setEditing(editing === item.id ? null : item.id)} className="cursor-pointer text-stone-400 hover:text-orange-600" aria-label="Edit">
              {editing === item.id ? <X size={14} /> : <Pencil size={14} />}
            </button>
            <button onClick={() => void duplicate(item)} className="cursor-pointer text-stone-400 hover:text-orange-600" aria-label="Duplicate" title="Duplicate (copy starts hidden)">
              <Copy size={14} />
            </button>
            <button onClick={() => void remove(item)} className="cursor-pointer text-stone-400 hover:text-red-600" aria-label="Move to trash">
              <Trash2 size={14} />
            </button>
            <Toggle
              on={item.visible}
              title={item.visible ? "Visible — click to hide" : "Hidden — click to show"}
              onClick={() => void patch(item.id, { visible: !item.visible })}
            />
          </div>
        </div>
        {editing === item.id && (
          <ItemForm
            item={item}
            depth={depth}
            location={location}
            linkGroups={linkGroups}
            onSaved={() => { setEditing(null); void reload(); }}
            onCancel={() => setEditing(null)}
          />
        )}
        {isOpen && !searchMode && (
          <div className="mb-1 ml-9 border-l border-stone-100 pl-2 dark:border-stone-800">
            {kids.map((kid) => renderRow(kid, depth + 1))}
            {editing === `new:${item.id}` ? (
              <ItemForm
                item={{ parentId: item.id }}
                depth={depth + 1}
                location={location}
                linkGroups={linkGroups}
                onSaved={() => { setEditing(null); void reload(); }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <button
                onClick={() => setEditing(`new:${item.id}`)}
                className="my-1 flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-50 dark:hover:bg-stone-800"
              >
                <Plus size={12} /> Add sub-item
              </button>
            )}
          </div>
        )}
        {!isOpen && !searchMode && kids.length === 0 && editing === `new:${item.id}` && (
          <ItemForm
            item={{ parentId: item.id }}
            depth={depth + 1}
            location={location}
            linkGroups={linkGroups}
            onSaved={() => { setEditing(null); void reload(); }}
            onCancel={() => setEditing(null)}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Loading menu…</p>;
  }

  return (
    <div>
      <datalist id="menu-link-targets">
        {linkGroups.flatMap((g) =>
          g.items.map((t) => (
            <option key={`${g.label}-${t.href}`} value={t.href}>
              {g.label}: {t.label}
            </option>
          )),
        )}
      </datalist>

      <div className="mb-4 flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800 sm:w-fit">
        {MENU_LOCATIONS.map((loc) => (
          <button
            key={loc.key}
            onClick={() => setLocation(loc.key)}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              location === loc.key
                ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            {loc.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {dirty ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            Unpublished changes
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            Live menu is up to date
          </span>
        )}
        {notice && <span className="text-xs text-stone-500">{notice}</span>}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTrash((v) => !v)}
            className={`${toolBtn} ${trash.length ? "text-red-700 dark:text-red-300" : ""}`}
          >
            <Trash2 size={13} /> Trash{trash.length ? ` (${trash.length})` : ""}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void importJson(file);
            }}
          />
          <button onClick={() => fileRef.current?.click()} className={toolBtn}>
            <Upload size={13} /> Import
          </button>
          <button
            onClick={() => { window.location.href = withBase(`/api/menus/io?location=${location}`); }}
            className={toolBtn}
          >
            <Download size={13} /> Export
          </button>
          <button
            onClick={async () => {
              if (!confirm("Replace this menu's DRAFT with the built-in defaults? The live site keeps the current menu until you publish.")) return;
              await fetch(withBase("/api/menus/reset"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ location }),
              });
              setNotice("Draft reset to defaults — review and publish when ready.");
              await reload();
            }}
            className={toolBtn}
          >
            Load defaults
          </button>
          <button onClick={loadVersions} className={toolBtn}>
            <History size={13} /> Versions
          </button>
          <button
            onClick={() => void checkLinks()}
            disabled={checking}
            className={toolBtn}
            title="Request every link and report the ones that do not resolve"
          >
            <LinkIcon size={13} /> {checking ? "Checking…" : "Check links"}
          </button>
          <button
            onClick={publish}
            disabled={publishing || !dirty}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
          >
            <Rocket size={13} /> {publishing ? "Publishing…" : "Publish menu"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search label, link or group…"
            aria-label="Search menu items"
            className={`${inputCls} pl-8`}
          />
        </div>
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-stone-100 px-3 py-1.5 dark:bg-stone-800">
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
              {selected.size} selected
            </span>
            <button onClick={() => void bulk("show")} className="cursor-pointer text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300">Show</button>
            <button onClick={() => void bulk("hide")} className="cursor-pointer text-xs font-semibold text-stone-600 hover:underline dark:text-stone-300">Hide</button>
            <button onClick={() => void bulk("trash")} className="cursor-pointer text-xs font-semibold text-red-700 hover:underline dark:text-red-300">Trash</button>
            <button onClick={() => setSelected(new Set())} className="cursor-pointer text-xs text-stone-400 hover:underline">Clear</button>
          </div>
        )}
      </div>

      {showTrash && (
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Trash</p>
          {trash.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">Nothing in the trash.</p>
          ) : (
            <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
              {trash.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <span className="font-medium text-stone-700 dark:text-stone-200">{t.label}</span>
                  <span className="text-xs text-stone-400">{t.href}</span>
                  <span className="text-xs text-stone-400">
                    {t.deletedAt ? new Date(t.deletedAt).toLocaleString("en-IN") : ""}
                  </span>
                  <div className="ml-auto flex items-center gap-3">
                    <button onClick={() => void restoreItem(t)} className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                      <RotateCcw size={12} /> Restore
                    </button>
                    <button onClick={() => void purgeItem(t)} className="cursor-pointer text-xs font-semibold text-red-700 hover:underline dark:text-red-300">
                      Delete forever
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {versions && (
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Published versions
          </p>
          {versions.length === 0 && (
            <p className="mt-2 text-sm text-stone-500">Nothing published yet.</p>
          )}
          <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="text-stone-700 dark:text-stone-200">
                  {new Date(v.createdAt).toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-stone-400">{v.authorName ?? "—"}</span>
                <button
                  onClick={() => restore(v.id)}
                  className="ml-auto cursor-pointer text-xs font-semibold text-orange-700 hover:underline"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-900">
        {matches ? (
          <>
            <p className="px-2 py-1 text-xs text-stone-400">
              {matches.length} match{matches.length === 1 ? "" : "es"} for &ldquo;{query}&rdquo; — clear the search to reorder.
            </p>
            {matches.map((m) => renderRow(m, m.parentId ? 1 : 0, true))}
          </>
        ) : (
          <>
            {childrenOf(null).map((top) => renderRow(top, 0))}
            {editing === "new:top" ? (
              <ItemForm
                item={{ parentId: null }}
                depth={0}
                location={location}
                linkGroups={linkGroups}
                onSaved={() => { setEditing(null); void reload(); }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <button
                onClick={() => setEditing("new:top")}
                className="mt-1 flex w-full cursor-pointer items-center gap-1.5 rounded-lg border-t border-dashed border-stone-200 px-2 pb-1 pt-2.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 dark:border-stone-800 dark:hover:bg-stone-800"
              >
                <Plus size={12} /> Add top-level item
              </button>
            )}
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-stone-400">
        Sub-items nest as deep as you need — expand a row and use &ldquo;Add
        sub-item&rdquo;. Drag rows to reorder within a level, or onto another
        branch to move them. Deletions go to the trash and can be restored.
        Changes go live only when you press Publish.
      </p>
    </div>
  );
}
