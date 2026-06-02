"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

const EMPTY: FormState = {
  name: "", brand: "", barcode: "", category: "",
  packaging: "", quantity: "1", expiryDate: "",
};

export default function AddPage() {
  const router = useRouter();
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstanceRef = useRef<{ clear: () => void } | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [scanning, setScanning] = useState(false);
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "found" | "not-found">("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function lookupBarcode(barcode: string) {
    setLookupState("loading");
    const res = await fetch(`/api/lookup?barcode=${barcode}`);
    const data = await res.json();
    if (data.found) {
      setForm((prev) => ({
        ...prev,
        barcode,
        name: data.name || prev.name,
        brand: data.brand || prev.brand,
        category: data.category || prev.category,
      }));
      setLookupState("found");
    } else {
      setForm((prev) => ({ ...prev, barcode }));
      setLookupState("not-found");
    }
  }

  function startScanner() {
    setScanning(true);
  }

  useEffect(() => {
    if (!scanning || !scannerRef.current) return;

    let stopped = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (stopped) return;
      const scanner = new Html5Qrcode("qr-reader");
      scannerInstanceRef.current = scanner;

      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          scanner.stop().then(() => {
            setScanning(false);
            lookupBarcode(decodedText);
          });
        },
        undefined
      ).catch(() => {
        setScanning(false);
        setError("Could not access camera. Enter barcode manually.");
      });
    });

    return () => {
      stopped = true;
      try { scannerInstanceRef.current?.clear(); } catch { }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity) || 1,
        expiryDate: form.expiryDate || null,
      }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      setError("Failed to save. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="text-gray-700 hover:text-gray-900 p-1 -ml-1">
          ←
        </button>
        <h1 className="text-lg font-semibold text-green-700">Add item</h1>
      </header>

      <main className="flex-1 px-4 py-5">
        {/* Scanner area */}
        {scanning ? (
          <div className="mb-5">
            <div id="qr-reader" ref={scannerRef} className="rounded-2xl overflow-hidden" />
            <button
              onClick={() => {
                try { scannerInstanceRef.current?.clear(); } catch { }
                setScanning(false);
              }}
              className="mt-2 w-full text-sm text-gray-700 underline"
            >
              Cancel scan
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startScanner}
            className="w-full mb-5 border-2 border-dashed border-green-300 rounded-2xl py-6 text-green-700 font-medium text-sm hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            📷 Scan barcode
          </button>
        )}

        {lookupState === "loading" && (
          <p className="text-center text-sm text-gray-600 mb-4">Looking up product...</p>
        )}
        {lookupState === "found" && (
          <p className="text-center text-sm text-green-600 mb-4">Product found ✓</p>
        )}
        {lookupState === "not-found" && (
          <p className="text-center text-sm text-amber-600 mb-4">Product not found — fill in manually.</p>
        )}

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          <Field label="Barcode">
            <input
              type="text"
              value={form.barcode}
              onChange={(e) => set("barcode", e.target.value)}
              onBlur={(e) => e.target.value && lookupBarcode(e.target.value)}
              placeholder="e.g. 4006381333931"
              className={inputCls}
            />
          </Field>

          <Field label="Name *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Chickpeas"
              className={inputCls}
              required
            />
          </Field>

          <Field label="Brand">
            <input
              type="text"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="e.g. Alnatura"
              className={inputCls}
            />
          </Field>

          <Field label="Category">
            <input
              type="text"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="e.g. legumes, coconut milk, corn"
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
            {saving ? "Saving..." : "Save to pantry"}
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
