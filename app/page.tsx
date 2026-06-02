"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  packaging: string | null;
  location: string;
  quantity: number;
  expiryDate: string | null;
};

const PACKAGING_EMOJI: Record<string, string> = {
  can: "🥫",
  glass: "🫙",
  carton: "📦",
  bag: "🛍️",
  tube: "🪥",
};

function daysLeft(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ dateStr }: { dateStr: string }) {
  const days = daysLeft(dateStr);
  const label = new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const color =
    days <= 7 ? "bg-red-100 text-red-700" :
    days <= 30 ? "bg-amber-100 text-amber-700" :
    "bg-green-100 text-green-700";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {label} · {days}d
    </span>
  );
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/items");
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function consume(id: number) {
    await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consumedAt: new Date().toISOString() }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function remove(id: number) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const filtered = items.filter((i) =>
    [i.name, i.brand, i.category, i.packaging]
      .join(" ")
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-semibold text-green-700">Pantry</h1>
        <Link
          href="/add"
          className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-green-700 active:scale-95 transition-transform"
        >
          + Add item
        </Link>
      </header>

      <div className="px-4 py-3">
        <input
          type="search"
          placeholder="Search items..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <main className="flex-1 px-4 pb-8 space-y-3">
        {loading && (
          <p className="text-center text-gray-600 text-sm pt-12">Loading...</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-600 text-sm pt-12">
            {filter ? "No items match." : "Your pantry is empty — add something!"}
          </p>
        )}
        {filtered.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Link href={`/edit/${item.id}`} className="font-medium text-gray-900 truncate hover:text-green-700 transition-colors block">
                  {item.packaging ? PACKAGING_EMOJI[item.packaging] + " " : ""}
                  {item.name}
                </Link>
                {item.brand && (
                  <p className="text-xs text-gray-600 mt-0.5">{item.brand}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {item.category && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  )}
                  {item.packaging && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full capitalize">
                      {item.packaging}
                    </span>
                  )}
                  {item.quantity > 1 && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      x{item.quantity}
                    </span>
                  )}
                  {item.expiryDate && <ExpiryBadge dateStr={item.expiryDate} />}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => consume(item.id)}
                  title="Mark as consumed"
                  className="text-green-600 hover:bg-green-50 rounded-xl p-2 transition-colors text-lg"
                >
                  ✓
                </button>
                <button
                  onClick={() => remove(item.id)}
                  title="Delete"
                  className="text-red-400 hover:bg-red-50 rounded-xl p-2 transition-colors text-lg"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
