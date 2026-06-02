"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { IconSearch, IconPlus, IconX, IconCheck, IconTrash, IconFilter } from "@/lib/icons";
import { CategoryIcon } from "@/lib/category";

type Item = {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  packaging: string | null;
  packagingTag: string | null;
  location: string;
  quantity: number;
  expiryDate: string | null;
};

// ── Expiry helpers ─────────────────────────────────────────
function daysLeft(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}
function expiryStatus(iso: string | null) {
  if (!iso) return "none";
  const d = daysLeft(iso);
  if (d < 0)  return "expired";
  if (d <= 7) return "orange";
  if (d <= 30) return "amber";
  return "green";
}
function fmtDate(iso: string) {
  return iso.split("T")[0];
}
function fmtLeft(iso: string) {
  const d = daysLeft(iso);
  if (d < 0) return `${Math.abs(d)}d ago`;
  if (d === 0) return "today";
  if (d <= 30) return `${d}d left`;
  if (d < 365) return `${Math.round(d / 30)}mo left`;
  return `${(d / 365).toFixed(1)}y left`;
}

function ExpiryLine({ iso }: { iso: string }) {
  const s = expiryStatus(iso);
  const color = s === "expired" ? "#C0531F" : s === "orange" ? "#C4893A" : s === "amber" ? "#6C6C74" : "#3A8048";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color, fontSize: 13, fontWeight: 600, letterSpacing: 0.2, whiteSpace: "nowrap" }}>
      {fmtDate(iso)}
      <span style={{ width: 4, height: 4, borderRadius: 999, background: "currentColor", flexShrink: 0 }} />
      {fmtLeft(iso)}
    </span>
  );
}

// ── Swipe-to-reveal row ────────────────────────────────────
function SwipeRow({ onEdit, onConsume, onDelete, leaving, rowBg, children }: {
  onEdit: () => void;
  onConsume: () => void;
  onDelete: () => void;
  leaving: boolean;
  rowBg?: string;
  children: React.ReactNode;
}) {
  const ACT = 80;
  const TOTAL = ACT * 2;
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dxRef = useRef(0);
  const st = useRef<{ x: number; base: number; moved: number } | null>(null);
  const suppress = useRef(false);

  const setDxBoth = (v: number) => { dxRef.current = v; setDx(v); };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const s = st.current; if (!s) return;
      const d = e.clientX - s.x;
      s.moved = Math.max(s.moved, Math.abs(d));
      setDxBoth(Math.max(-TOTAL, Math.min(0, s.base + d)));
    };
    const up = () => {
      const s = st.current; if (!s) return;
      st.current = null;
      setDragging(false);
      setDxBoth(dxRef.current < -TOTAL / 2 ? -TOTAL : 0);
      if (s.moved > 6) { suppress.current = true; setTimeout(() => { suppress.current = false; }, 150); }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  const onDown = (e: React.PointerEvent) => {
    st.current = { x: e.clientX, base: dxRef.current, moved: 0 };
    setDragging(true);
  };
  const onClick = (e: React.MouseEvent) => {
    if (suppress.current) { e.stopPropagation(); e.preventDefault(); return; }
    if (dxRef.current !== 0) { e.stopPropagation(); e.preventDefault(); setDxBoth(0); return; }
    onEdit();
  };

  const actionBtn = (isConsume: boolean) => (
    <button
      onClick={(e) => { e.stopPropagation(); setDxBoth(0); isConsume ? onConsume() : onDelete(); }}
      style={{
        width: ACT, border: "none", cursor: "pointer", flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
        background: isConsume ? "var(--green)" : "var(--red)", color: "#fff",
        fontFamily: "'Jost', system-ui, sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: 0.2,
      }}
    >
      {isConsume ? <IconCheck size={22} /> : <IconTrash size={21} />}
      {isConsume ? "Used" : "Delete"}
    </button>
  );

  return (
    <div style={{
      overflow: "hidden", position: "relative",
      opacity: leaving ? 0 : 1,
      maxHeight: leaving ? 0 : 200,
      transition: "opacity .22s ease, max-height .3s ease .04s",
    }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "flex-end" }}>
        {actionBtn(true)}
        {actionBtn(false)}
      </div>
      <div
        onPointerDown={onDown}
        onClick={onClick}
        style={{
          position: "relative",
          transform: `translateX(${dx}px)`,
          touchAction: "pan-y",
          userSelect: "none",
          WebkitUserSelect: "none",
          cursor: "pointer",
          transition: dragging ? "none" : "transform .28s cubic-bezier(.2,0,0,1)",
          background: rowBg,
        }}
      >
        {children}
        <span style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          color: "var(--faint)", opacity: dx === 0 ? 0.4 : 0, transition: "opacity .15s ease", pointerEvents: "none",
        }}>
          <svg width="7" height="13" viewBox="0 0 7 13" fill="none">
            <path d="M6 1L1.5 6.5 6 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}

// ── Item row ───────────────────────────────────────────────
function ItemRow({ item, onConsume, onDelete, leaving, rowBg }: {
  item: Item;
  onConsume: () => void;
  onDelete: () => void;
  leaving: boolean;
  rowBg?: string;
}) {
  const meta = [item.brand, item.category, item.packagingTag || null]
    .filter(Boolean).join(" · ");

  return (
    <SwipeRow
      onEdit={() => { window.location.href = `/edit/${item.id}`; }}
      onConsume={onConsume}
      onDelete={onDelete}
      leaving={leaving}
      rowBg={rowBg}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 32px 14px 16px", borderBottom: "1px solid var(--border)" }}>
        <CategoryIcon category={item.category} size={22} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 17, color: "var(--ink)", letterSpacing: -0.3, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.name}
          </div>
          {meta && (
            <div style={{
              fontSize: 12.5, fontWeight: 500, color: "var(--muted)", marginTop: 3,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {meta}
            </div>
          )}
          {item.expiryDate && (
            <div style={{ marginTop: 8 }}>
              <ExpiryLine iso={item.expiryDate} />
            </div>
          )}
        </div>
        {item.quantity > 1 && (
          <div style={{
            flexShrink: 0, alignSelf: "center", marginRight: 16,
            height: 24, minWidth: 32, padding: "0 9px", borderRadius: 999,
            background: "var(--field-bg)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "var(--ink)",
          }}>
            ×{item.quantity}
          </div>
        )}
      </div>
    </SwipeRow>
  );
}

// ── Group header ───────────────────────────────────────────
function GroupHeader({ label, sub, count, color }: { label: string; sub?: string; count: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "22px 16px 10px", flexWrap: "nowrap" }}>
      <h2 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: color ?? "var(--ink)", whiteSpace: "nowrap", flexShrink: 0 }}>{label}</h2>
      <span style={{
        minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999, flexShrink: 0,
        background: color ? `${color}22` : "var(--chip-bg)",
        color: color ?? "var(--chip-ink)", fontSize: 11.5, fontWeight: 700,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{count}</span>
      {sub && <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>}
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────
function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", left: "50%", bottom: 36, transform: "translateX(-50%)", zIndex: 80,
      padding: "12px 20px", borderRadius: 999, whiteSpace: "nowrap",
      background: "var(--ink)", color: "var(--bg)",
      fontFamily: "'Jost', system-ui, sans-serif", fontSize: 14, fontWeight: 600,
      boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
      animation: "toastIn .26s cubic-bezier(.2,0,0,1)",
    }}>{msg}</div>
  );
}

// ── Main ───────────────────────────────────────────────────
type Grouping = "urgency" | "category" | "all";

const URGENCY_GROUPS = [
  { key: "expired", label: "Expired",        sub: "past expiry date" },
  { key: "orange",  label: "Expiring soon",  sub: "7 days or less" },
  { key: "amber",   label: "Use this month", sub: "within 30 days" },
  { key: "green",   label: "Plenty of time", sub: "over a month" },
  { key: "none",    label: "No expiry set",  sub: "" },
];

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [grouping, setGrouping] = useState<Grouping>("urgency");
  const [leavingId, setLeavingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searchFocus, setSearchFocus] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterUrgencies, setFilterUrgencies] = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    const res = await fetch("/api/items");
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function flash(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  }

  function removeWithAnim(id: number, msg: string) {
    setLeavingId(id);
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
      setLeavingId(null);
      flash(msg);
    }, 300);
  }

  async function consume(id: number) {
    const item = items.find(i => i.id === id);
    if (item && item.quantity > 1) {
      await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: item.quantity - 1 }),
      });
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i));
      flash(`1 used — ${item.quantity - 1} remaining`);
    } else {
      await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumedAt: new Date().toISOString() }),
      });
      removeWithAnim(id, "Marked as used");
    }
  }

  async function remove(id: number) {
    const item = items.find(i => i.id === id);
    if (item && item.quantity > 1) {
      await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: item.quantity - 1 }),
      });
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i));
      flash(`${item.quantity - 1} remaining`);
    } else {
      if (!confirm("Delete this item?")) return;
      await fetch(`/api/items/${id}`, { method: "DELETE" });
      removeWithAnim(id, "Item deleted");
    }
  }

  const allCategories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;
    const q = filter.trim().toLowerCase();
    if (q) result = result.filter(i => [i.name, i.brand, i.category].join(" ").toLowerCase().includes(q));
    if (filterUrgencies.length) result = result.filter(i => filterUrgencies.includes(expiryStatus(i.expiryDate)));
    if (filterCategories.length) result = result.filter(i => filterCategories.includes(i.category ?? ""));
    return result;
  }, [items, filter, filterUrgencies, filterCategories]);

  const groups = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });

    if (grouping === "all") return [{ key: "all", label: "", count: sorted.length, items: sorted }];

    if (grouping === "urgency") {
      return URGENCY_GROUPS.map(g => ({
        key: g.key, label: g.label, sub: g.sub, count: 0,
        items: sorted.filter(i => expiryStatus(i.expiryDate) === g.key),
      })).filter(g => g.items.length).map(g => ({ ...g, count: g.items.length }));
    }

    // category grouping
    const cats: Record<string, Item[]> = {};
    sorted.forEach(i => { const k = i.category || "Uncategorised"; (cats[k] ||= []).push(i); });
    return Object.keys(cats).sort().map(k => ({ key: k, label: k, count: cats[k].length, items: cats[k] }));
  }, [filtered, grouping]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }} className="screen-in">
      {/* Header */}
      <div style={{ background: "var(--bg)", padding: "52px 16px 0", flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 6 }}>
          <h1 style={{ margin: 0, fontFamily: "'Jost', system-ui, sans-serif", fontWeight: 700, fontSize: 32, letterSpacing: -0.8, color: "var(--ink)", lineHeight: 1 }}>
            Pantry
          </h1>
          <Link href="/add" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 15px 9px 12px", borderRadius: 999, textDecoration: "none",
            background: "var(--accent-soft)", color: "var(--accent)",
            fontFamily: "'Jost', system-ui, sans-serif", fontSize: 14.5, fontWeight: 600, letterSpacing: -0.1,
          }}>
            <IconPlus size={17} /> Add item
          </Link>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginTop: 18,
          padding: "5px 14px", borderRadius: 999,
          background: "var(--field-bg)", border: `1.5px solid ${searchFocus ? "var(--accent)" : "transparent"}`,
          transition: "border-color .15s ease",
        }}>
          <span style={{ color: "var(--faint)", display: "inline-flex" }}><IconSearch size={19} /></span>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            placeholder="Search items…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "'Jost', system-ui, sans-serif", fontSize: 15.5, color: "var(--ink)" }}
          />
          {filter && (
            <button onClick={() => setFilter("")} style={{ all: "unset", cursor: "pointer", color: "var(--faint)", display: "inline-flex" }}>
              <IconX size={17} />
            </button>
          )}
        </div>

        {/* Group switch + filter button */}
        <div style={{ marginTop: 14, paddingBottom: filterOpen ? 0 : 14, display: "flex", gap: 6, alignItems: "center" }}>
          {(["urgency", "category", "all"] as Grouping[]).map(g => (
            <button key={g} onClick={() => setGrouping(g)} style={{
              all: "unset", cursor: "pointer", padding: "5px 12px", borderRadius: 999,
              fontSize: 12.5, fontWeight: 600, letterSpacing: 0.1, whiteSpace: "nowrap",
              color: grouping === g ? "var(--accent-ink)" : "var(--muted)",
              background: grouping === g ? "var(--accent)" : "var(--surface-2)",
              transition: "background .12s ease, color .12s ease",
            }}>
              {g === "urgency" ? "Urgency" : g === "category" ? "Category" : "All items"}
            </button>
          ))}
          <button onClick={() => setFilterOpen(o => !o)} style={{
            all: "unset", cursor: "pointer", marginLeft: "auto", display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 999,
            background: (filterUrgencies.length || filterCategories.length) ? "var(--accent)" : "var(--surface-2)",
            color: (filterUrgencies.length || filterCategories.length) ? "var(--accent-ink)" : "var(--muted)",
            position: "relative", transition: "background .12s ease, color .12s ease",
          }}>
            <IconFilter size={15} />
            {(filterUrgencies.length + filterCategories.length) > 0 && (
              <span style={{
                position: "absolute", top: -2, right: -2, width: 14, height: 14,
                borderRadius: 999, background: "var(--red)", color: "#fff",
                fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              }}>{filterUrgencies.length + filterCategories.length}</span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {filterOpen && (
          <div style={{ paddingBottom: 14, paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Urgency row */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--faint)", letterSpacing: 0.6, textTransform: "uppercase", flexShrink: 0, width: 60, paddingTop: 4 }}>Urgency</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {[
                  { key: "expired", label: "Expired" },
                  { key: "orange",  label: "Soon" },
                  { key: "amber",   label: "This month" },
                  { key: "green",   label: "Plenty" },
                ].map(({ key, label }) => {
                  const on = filterUrgencies.includes(key);
                  return (
                    <button key={key} onClick={() => setFilterUrgencies(prev => on ? prev.filter(x => x !== key) : [...prev, key])} style={{
                      all: "unset", cursor: "pointer", padding: "3px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                      background: on ? "var(--accent)" : "var(--surface-2)",
                      color: on ? "var(--accent-ink)" : "var(--muted)",
                    }}>{label}</button>
                  );
                })}
              </div>
            </div>
            {/* Category row */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--faint)", letterSpacing: 0.6, textTransform: "uppercase", flexShrink: 0, width: 60, paddingTop: 4 }}>Category</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {allCategories.map(cat => {
                  const on = filterCategories.includes(cat);
                  return (
                    <button key={cat} onClick={() => setFilterCategories(prev => on ? prev.filter(x => x !== cat) : [...prev, cat])} style={{
                      all: "unset", cursor: "pointer", padding: "3px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                      background: on ? "var(--accent)" : "var(--surface-2)",
                      color: on ? "var(--accent-ink)" : "var(--muted)",
                    }}>{cat}</button>
                  );
                })}
              </div>
            </div>
            {(filterUrgencies.length > 0 || filterCategories.length > 0) && (
              <button onClick={() => { setFilterUrgencies([]); setFilterCategories([]); }} style={{
                all: "unset", cursor: "pointer", fontSize: 11.5, color: "var(--red)", fontWeight: 600, paddingLeft: 68,
              }}>Clear all</button>
            )}
          </div>
        )}
        <div style={{ height: 1, background: "var(--border)", margin: "0 -16px" }} />
      </div>

      {/* List */}
      <main style={{ flex: 1, paddingBottom: 100 }}>
        {loading && (
          <p style={{ textAlign: "center", color: "var(--faint)", fontSize: 14, paddingTop: 64 }}>Loading…</p>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--muted)" }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: "var(--ink)", marginBottom: 6 }}>
              {filter ? "Nothing found" : "Pantry is empty"}
            </div>
            <div style={{ fontSize: 14 }}>
              {filter ? `No items match "${filter}".` : "Tap Add item to get started."}
            </div>
          </div>
        )}
        {groups.map(g => {
          const isExpired = g.key === "expired";
          return (
            <div key={g.key}>
              {g.label && <GroupHeader label={g.label} sub={(g as { sub?: string }).sub} count={g.count} color={isExpired ? "#C0531F" : undefined} />}
              {!g.label && <div style={{ height: 12 }} />}
              {g.items.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onConsume={() => consume(item.id)}
                  onDelete={() => remove(item.id)}
                  leaving={leavingId === item.id}
                  rowBg={isExpired ? "#FEF0ED" : "var(--bg)"}
                />
              ))}
            </div>
          );
        })}
      </main>

      <Toast msg={toast} />
    </div>
  );
}
