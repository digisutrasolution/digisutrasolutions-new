"use client";

import { withBase } from "@/lib/base-path";

import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  History,
  Pencil,
  Plus,
  Rocket,
  Trash2,
  X,
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
};

type Version = { id: string; authorName: string | null; createdAt: string };

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100";
const labelCls =
  "mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400";

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

/* Inline edit form for one item (header top-level items expose panel fields). */
function ItemForm({
  item,
  isTop,
  location,
  onSaved,
  onCancel,
}: {
  item: Partial<Item> & { parentId: string | null };
  isTop: boolean;
  location: MenuLocation;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isNew = !item.id;
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
          <input value={f.href} onChange={(e) => set("href", e.target.value)} className={inputCls} placeholder="/services/seo" />
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
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null); // item id or "new:<parentId|top>"
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState("");
  const [versions, setVersions] = useState<Version[] | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch(withBase(`/api/menus?location=${location}`));
    const data = await res.json();
    if (data.ok) {
      setItems(data.items);
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
      void reload();
    }, 0);
    return () => clearTimeout(t);
  }, [reload]);

  const tops = useMemo(
    () => items.filter((i) => !i.parentId).sort((a, b) => a.order - b.order),
    [items],
  );
  const childrenOf = useCallback(
    (id: string) =>
      items.filter((i) => i.parentId === id).sort((a, b) => a.order - b.order),
    [items],
  );

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

  const remove = async (item: Item) => {
    const kids = childrenOf(item.id).length;
    if (!confirm(`Delete "${item.label}"${kids ? ` and its ${kids} sub-items` : ""}?`)) return;
    await fetch(withBase(`/api/menus/${item.id}`), { method: "DELETE" });
    await reload();
  };

  const onDrop = async (target: Item) => {
    setDropTarget(null);
    if (!dragId || dragId === target.id) return;
    const dragged = items.find((i) => i.id === dragId);
    setDragId(null);
    if (!dragged) return;

    const draggedHasKids = items.some((i) => i.parentId === dragged.id);

    if (dragged.parentId === target.parentId) {
      // Same level: reorder.
      const siblings = items
        .filter((i) => i.parentId === target.parentId)
        .sort((a, b) => a.order - b.order)
        .filter((i) => i.id !== dragged.id);
      const idx = siblings.findIndex((s) => s.id === target.id);
      await patch(dragged.id, { moveTo: idx < 0 ? siblings.length : idx });
      return;
    }

    // Cross-parent: only leaf items can move under another parent.
    if (draggedHasKids) {
      setNotice("Items with sub-items can only be reordered at the top level.");
      return;
    }
    if (!target.parentId) {
      // Dropped onto a top-level row → append as its last child.
      await patch(dragged.id, { parentId: target.id });
      setExpanded((s) => new Set(s).add(target.id));
      return;
    }
    // Dropped onto a child of another parent → insert at its position.
    const siblings = items
      .filter((i) => i.parentId === target.parentId && i.id !== dragged.id)
      .sort((a, b) => a.order - b.order);
    const idx = siblings.findIndex((s) => s.id === target.id);
    await patch(dragged.id, {
      parentId: target.parentId,
      moveTo: idx < 0 ? siblings.length : idx,
    });
  };

  const duplicate = async (item: Item) => {
    const res = await fetch(withBase(`/api/menus/${item.id}/duplicate`), { method: "POST" });
    const data = await res.json();
    if (!data.ok) setNotice(data.error ?? "Duplicate failed.");
    else setNotice(`Duplicated "${item.label}" — the copy starts hidden.`);
    await reload();
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
    draggable: true,
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

  if (loading) {
    return <p className="text-sm text-stone-500">Loading menu…</p>;
  }

  return (
    <div>
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
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={loadVersions}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-400 dark:border-stone-700 dark:text-stone-300"
          >
            <History size={13} /> Versions
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
        {tops.map((top) => {
          const kids = childrenOf(top.id);
          const isOpen = expanded.has(top.id);
          return (
            <div key={top.id}>
              <div
                {...dragProps(top)}
                className={`flex items-center gap-2 rounded-lg px-2 py-2 ${
                  dropTarget === top.id && dragId && dragId !== top.id
                    ? "bg-orange-50 outline outline-1 outline-dashed outline-orange-400 dark:bg-stone-800"
                    : ""
                } ${!top.visible ? "opacity-50" : ""}`}
              >
                <GripVertical size={15} className="shrink-0 cursor-grab text-stone-300 dark:text-stone-600" />
                <button
                  onClick={() =>
                    setExpanded((s) => {
                      const n = new Set(s);
                      if (n.has(top.id)) n.delete(top.id);
                      else n.add(top.id);
                      return n;
                    })
                  }
                  className="cursor-pointer text-stone-400"
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
                <span className="font-semibold text-stone-900 dark:text-stone-100">{top.label}</span>
                <span className="hidden text-xs text-stone-400 sm:inline">
                  {top.href} · {kids.length} {kids.length === 1 ? "item" : "items"}
                  {top.featured ? " · journal card" : ""}
                </span>
                {!top.visible && <span className="text-[10px] font-bold text-stone-400">HIDDEN</span>}
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => setEditing(editing === top.id ? null : top.id)} className="cursor-pointer text-stone-400 hover:text-orange-600" aria-label="Edit">
                    {editing === top.id ? <X size={14} /> : <Pencil size={14} />}
                  </button>
                  <button onClick={() => void duplicate(top)} className="cursor-pointer text-stone-400 hover:text-orange-600" aria-label="Duplicate" title="Duplicate (copy starts hidden)">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => void remove(top)} className="cursor-pointer text-stone-400 hover:text-red-600" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                  <Toggle on={top.visible} title={top.visible ? "Visible — click to hide" : "Hidden — click to show"} onClick={() => void patch(top.id, { visible: !top.visible })} />
                </div>
              </div>
              {editing === top.id && (
                <ItemForm item={top} isTop location={location} onSaved={() => { setEditing(null); void reload(); }} onCancel={() => setEditing(null)} />
              )}
              {isOpen && (
                <div className="mb-1 ml-9 border-l border-stone-100 pl-2 dark:border-stone-800">
                  {kids.map((kid) => {
                    const Icon = navIcon(kid.icon ?? undefined);
                    return (
                      <div key={kid.id}>
                        <div
                          {...dragProps(kid)}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                            dropTarget === kid.id && dragId && dragId !== kid.id
                              ? "bg-orange-50 outline outline-1 outline-dashed outline-orange-400 dark:bg-stone-800"
                              : ""
                          } ${!kid.visible ? "opacity-50" : ""}`}
                        >
                          <GripVertical size={14} className="shrink-0 cursor-grab text-stone-300 dark:text-stone-600" />
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-500 dark:bg-stone-800">
                            <Icon size={13} />
                          </span>
                          <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{kid.label}</span>
                          {kid.badge && (
                            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-900 dark:bg-orange-900/40 dark:text-orange-200">
                              {kid.badge}
                            </span>
                          )}
                          {kid.group && <span className="hidden text-[10px] text-stone-400 md:inline">{kid.group}</span>}
                          {!kid.visible && <span className="text-[10px] font-bold text-stone-400">HIDDEN</span>}
                          <div className="ml-auto flex items-center gap-2">
                            <button onClick={() => setEditing(editing === kid.id ? null : kid.id)} className="cursor-pointer text-stone-400 hover:text-orange-600" aria-label="Edit">
                              {editing === kid.id ? <X size={13} /> : <Pencil size={13} />}
                            </button>
                            <button onClick={() => void duplicate(kid)} className="cursor-pointer text-stone-400 hover:text-orange-600" aria-label="Duplicate" title="Duplicate (copy starts hidden)">
                              <Copy size={13} />
                            </button>
                            <button onClick={() => void remove(kid)} className="cursor-pointer text-stone-400 hover:text-red-600" aria-label="Delete">
                              <Trash2 size={13} />
                            </button>
                            <Toggle on={kid.visible} title={kid.visible ? "Visible — click to hide" : "Hidden — click to show"} onClick={() => void patch(kid.id, { visible: !kid.visible })} />
                          </div>
                        </div>
                        {editing === kid.id && (
                          <ItemForm item={kid} isTop={false} location={location} onSaved={() => { setEditing(null); void reload(); }} onCancel={() => setEditing(null)} />
                        )}
                      </div>
                    );
                  })}
                  {editing === `new:${top.id}` ? (
                    <ItemForm item={{ parentId: top.id }} isTop={false} location={location} onSaved={() => { setEditing(null); void reload(); }} onCancel={() => setEditing(null)} />
                  ) : (
                    <button
                      onClick={() => setEditing(`new:${top.id}`)}
                      className="my-1 flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-50 dark:hover:bg-stone-800"
                    >
                      <Plus size={12} /> Add sub-item
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {editing === "new:top" ? (
          <ItemForm item={{ parentId: null }} isTop location={location} onSaved={() => { setEditing(null); void reload(); }} onCancel={() => setEditing(null)} />
        ) : (
          <button
            onClick={() => setEditing("new:top")}
            className="mt-1 flex w-full cursor-pointer items-center gap-1.5 rounded-lg border-t border-dashed border-stone-200 px-2 pb-1 pt-2.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 dark:border-stone-800 dark:hover:bg-stone-800"
          >
            <Plus size={12} /> Add top-level item
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-stone-400">
        Drag rows to reorder within their level. Changes go live only when you
        press Publish; Versions restores any earlier published menu.
      </p>
    </div>
  );
}
