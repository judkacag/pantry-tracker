"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ItemForm, type FormState } from "@/lib/ItemForm";

const EMPTY: FormState = { name: "", brand: "", barcode: "", category: "", packaging: "", packagingTag: "", packSize: "", nutriscoreGrade: "", labelTags: "", imageUrl: "", quantity: 1, expiryDate: "" };

export default function AddPage() {
  const router = useRouter();
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstanceRef = useRef<{ clear: () => void } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "found" | "not-found">("idle");
  const [form, setForm] = useState<FormState>(EMPTY);

  async function lookupBarcode(barcode: string) {
    setLookupState("loading");
    const res = await fetch(`/api/lookup?barcode=${barcode}`);
    const data = await res.json();
    if (data.found) {
      setForm(prev => ({
        ...prev, barcode,
        name:            data.name || prev.name,
        brand:           data.brand || prev.brand,
        category:        data.category || prev.category,
        packagingTag:    data.packagingTag || prev.packagingTag,
        packSize:        data.packSize || prev.packSize,
        nutriscoreGrade: data.nutriscoreGrade || prev.nutriscoreGrade,
        labelTags:       data.labelTags || prev.labelTags,
        imageUrl:        data.imageUrl || prev.imageUrl,
      }));
      setLookupState("found");
    } else {
      setForm(prev => ({ ...prev, barcode }));
      setLookupState("not-found");
    }
  }

  function startScanner() { setScanning(true); }

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
        (decoded) => { scanner.stop().then(() => { setScanning(false); lookupBarcode(decoded); }); },
        undefined
      ).catch(() => { setScanning(false); });
    });

    return () => {
      stopped = true;
      try { scannerInstanceRef.current?.clear(); } catch { }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  async function onSave(data: FormState) {
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, expiryDate: data.expiryDate || null }),
    });
    router.push("/");
  }

  // Scanner overlay
  if (scanning) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "52px 20px 20px" }}>
          <div id="qr-reader" ref={scannerRef} style={{ borderRadius: 14, overflow: "hidden" }} />
          <button
            type="button"
            onClick={() => { try { scannerInstanceRef.current?.clear(); } catch { } setScanning(false); }}
            style={{ marginTop: 16, width: "100%", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14, fontFamily: "'Jost', system-ui, sans-serif" }}
          >
            Cancel scan
          </button>
        </div>
      </div>
    );
  }

  // Looking up — keep off screen until data is ready so ItemForm mounts with filled initial
  if (lookupState === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <p style={{ color: "var(--muted)", fontSize: 15, fontFamily: "'Jost', system-ui, sans-serif" }}>Looking up product…</p>
      </div>
    );
  }

  // ItemForm mounts fresh — initial already has all data from the lookup
  return (
    <ItemForm
      key={form.barcode || "new"}
      mode="add"
      initial={form}
      onSave={onSave}
      onScan={startScanner}
      onBarcodeLookup={lookupBarcode}
      lookupState={lookupState}
    />
  );
}
