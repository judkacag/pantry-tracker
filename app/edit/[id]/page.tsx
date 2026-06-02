"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const PACKAGING_OPTIONS = ["can", "glass", "carton", "bag", "tube"];

type FormState = {
  name: string;
  brand: string;
  barcode: string;
  category: string;
  packaging: string;
  quantity: string;
  expiryDate: string;
};

export default function EditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((items) => {
        const item = items.find((i: { id: number }) => i.id === Number(id));
        if (!item) { router.push("/"); return; }
        setForm({
          name: item.name ?? "",
          brand: item.brand ?? "",
          barcode: item.barcode ?? "",
          category: item.category ?? "",
          packaging: item.packaging ?? "",
          quantity: String(item.quantity ?? 1),
          expiryDate: item.expiryDate
            ? new Date(item.expiryDate).toISOString().split("T")[0]
            : "",
        });
      });
  }, [id, router]);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form?.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const res = await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: Number(form.quantity) || 1 }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      setError("Failed to save. Try again.");
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <h1 className="text-lg font-semibold text-green-700">Edit item</h1>
        </header>
        <p className="text-center text-gray-400 text-sm pt-12">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="text-gray-700 hover:text-gray-900 p-1 -ml-1">
          ←
        </button>
        <h1 className="text-lg font-semibold text-green-700">Edit item</h1>
      </header>

      <main className="flex-1 px-4 py-5">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          <Field label="Name *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
              required
            />
          </Field>

          <Field label="Brand">
            <input
              type="text"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Barcode">
            <input
              type="text"
              value={form.barcode}
              onChange={(e) => set("barcode", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Category">
            <input
              type="text"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Packaging">
            <div className="flex flex-wrap gap-2">
              {PACKAGING_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("packaging", form.packaging === p ? "" : p)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
                    form.packaging === p
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-green-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Expiry date">
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => set("expiryDate", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-green-700 disabled:opacity-60 transition-colors mt-2"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500";
