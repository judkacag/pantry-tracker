"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconBack, IconCamera, IconCalendar, IconMinus, IconPlus } from "@/lib/icons";

export type FormState = {
  name: string;
  brand: string;
  barcode: string;
  category: string;
  packaging: string;
  packagingTag: string;
  packSize: string;
  nutriscoreGrade: string;
  labelTags: string;
  imageUrl: string;
  quantity: number;
  expiryDate: string;
};

const CATEGORIES = [
  "Dairy & eggs",
  "Grains & pasta",
  "Legumes",
  "Herbs & spices",
  "Cooking staples",
  "Snacks & sweets",
  "Drinks",
  "Baking",
  "Fresh produce",
  "Meat & fish",
  "Others",
];

const PACKAGING_TAGS = [
  "Tetra Pak", "Glass jar", "Glass bottle", "Metal can", "Plastic bag",
  "Paper bag", "Cardboard box", "Plastic bottle", "Plastic tub",
  "Tube", "Sachet", "Pouch", "Vacuum pack", "Multilayer composite",
];

const NUTRISCORE_GRADES = ["A", "B", "C", "D", "E"];

const PACKAGING: { key: string; label: string; emoji: string }[] = [
  { key: "can",    label: "Can",    emoji: "🥫" },
  { key: "glass",  label: "Glass",  emoji: "🫙" },
  { key: "carton", label: "Carton", emoji: "📦" },
  { key: "bag",    label: "Bag",    emoji: "🛍️" },
  { key: "tube",   label: "Tube",   emoji: "🧪" },
];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
      {children}{required && <span style={{ color: "var(--accent)" }}> *</span>}
    </div>
  );
}

function TextField({ label, required, value, onChange, placeholder, inputMode }: {
  label: string; required?: boolean; value: string;
  onChange: (v: string) => void; placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div style={{
        display: "flex", alignItems: "center", height: 52, padding: "0 15px",
        borderRadius: "var(--radius-sm)", background: "var(--field-bg)",
        border: `1.5px solid ${focus ? "var(--accent)" : "var(--border)"}`,
        transition: "border-color .15s ease",
      }}>
        <input
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          placeholder={placeholder} inputMode={inputMode}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "'Jost', system-ui, sans-serif", fontSize: 16, color: "var(--ink)", minWidth: 0 }}
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{
        display: "flex", alignItems: "center", height: 52, padding: "0 15px",
        borderRadius: "var(--radius-sm)", background: "var(--field-bg)",
        border: `1.5px solid ${focus ? "var(--accent)" : "var(--border)"}`,
        transition: "border-color .15s ease",
      }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontFamily: "'Jost', system-ui, sans-serif", fontSize: 16,
            color: value ? "var(--ink)" : "var(--faint)",
            appearance: "none", WebkitAppearance: "none", cursor: "pointer",
          }}
        >
          <option value="">{placeholder ?? "N/A"}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{ color: "var(--faint)", fontSize: 12, pointerEvents: "none" }}>▾</span>
      </div>
    </div>
  );
}

function PackagingPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <FieldLabel>Packaging</FieldLabel>
      <div style={{ display: "flex", gap: 8 }}>
        {PACKAGING.map(({ key, label, emoji }) => {
          const on = value === key;
          return (
            <button key={key} type="button" onClick={() => onChange(on ? "" : key)} style={{
              all: "unset", cursor: "pointer", flex: 1, boxSizing: "border-box",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              padding: "11px 4px 9px", borderRadius: "var(--radius-sm)",
              background: on ? "var(--accent)" : "var(--field-bg)",
              border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
              transition: "background .12s ease, border-color .12s ease",
            }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: on ? "var(--accent-ink)" : "var(--ink)" }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QtyStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const Btn = ({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      width: 42, height: 42, borderRadius: "var(--radius-sm)", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1.5px solid var(--border)", background: "var(--field-bg)",
      color: disabled ? "var(--faint)" : "var(--ink)", cursor: disabled ? "default" : "pointer",
    }}>{children}</button>
  );
  return (
    <div>
      <FieldLabel>Quantity</FieldLabel>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Btn onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1}><IconMinus size={20} /></Btn>
        <div style={{
          flex: 1, height: 52, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "var(--radius-sm)", background: "var(--field-bg)", border: "1.5px solid var(--border)",
          fontSize: 20, fontWeight: 700, color: "var(--ink)",
        }}>{value}</div>
        <Btn onClick={() => onChange(value + 1)}><IconPlus size={20} /></Btn>
      </div>
    </div>
  );
}

function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <FieldLabel>Expiry date</FieldLabel>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, height: 52, padding: "0 15px",
        borderRadius: "var(--radius-sm)", background: "var(--field-bg)",
        border: `1.5px solid ${focus ? "var(--accent)" : "var(--border)"}`,
      }}>
        <span style={{ color: "var(--faint)", display: "inline-flex" }}><IconCalendar size={20} /></span>
        <input type="date" value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "'Jost', system-ui, sans-serif", fontSize: 16, color: value ? "var(--ink)" : "var(--faint)", minWidth: 0 }} />
      </div>
    </div>
  );
}

export function ItemForm({
  mode,
  initial,
  onSave,
  onScan,
  lookupState,
}: {
  mode: "add" | "edit";
  initial: FormState;
  onSave: (data: FormState) => Promise<void>;
  onScan?: () => void;
  lookupState?: "idle" | "loading" | "found" | "not-found";
}) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  const set = (k: keyof FormState, v: string | number) => setF(prev => ({ ...prev, [k]: v }));
  const valid = f.name.trim().length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) { setError("Name is required."); return; }
    setSaving(true);
    try { await onSave(f); } catch { setError("Failed to save. Try again."); setSaving(false); }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }} className="screen-in">
      {/* Header */}
      <div style={{ background: "var(--bg)", padding: "52px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 6, paddingBottom: 18 }}>
          <button type="button" onClick={() => router.back()} style={{
            width: 40, height: 40, marginLeft: -8, borderRadius: 999,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", background: "transparent", cursor: "pointer", color: "var(--ink)",
          }}><IconBack size={24} /></button>
          <h1 style={{ margin: 0, fontWeight: 700, fontSize: 26, letterSpacing: -0.5, color: "var(--ink)", lineHeight: 1 }}>
            {mode === "edit" ? "Edit item" : "Add item"}
          </h1>
        </div>
        <div style={{ height: 1, background: "var(--border)", margin: "0 -20px" }} />
      </div>

      {/* Body */}
      <form onSubmit={submit} style={{ flex: 1, overflow: "auto", padding: "22px 20px 140px", display: "flex", flexDirection: "column", gap: 20 }}>
        {mode === "add" && (
          <div>
            <button type="button" onClick={onScan} style={{
              all: "unset", cursor: "pointer", boxSizing: "border-box", width: "100%",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
              minHeight: 104, borderRadius: "var(--radius)", color: "var(--accent)",
              border: "2px dashed var(--accent)", background: "var(--accent-soft)",
            }}>
              <span style={{ display: "inline-flex" }}><IconCamera size={28} /></span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {lookupState === "loading" ? "Looking up…" : "Scan barcode"}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>
                {lookupState === "found" ? "Product found ✓" : lookupState === "not-found" ? "Not found — fill in manually" : "Auto-fills product details"}
              </span>
            </button>
          </div>
        )}

        {error && <p style={{ margin: 0, fontSize: 13, color: "var(--red)" }}>{error}</p>}

        <TextField label="Barcode" value={f.barcode} onChange={v => set("barcode", v)} placeholder="e.g. 4006381333931" inputMode="numeric" />
        <TextField label="Name" required value={f.name} onChange={v => set("name", v)} placeholder="e.g. Chickpeas" />
        <TextField label="Brand" value={f.brand} onChange={v => set("brand", v)} placeholder="e.g. Alnatura" />
        <div>
          <FieldLabel>Category</FieldLabel>
          <div style={{
            height: 52, padding: "0 15px", borderRadius: "var(--radius-sm)",
            background: "var(--field-bg)", border: "1.5px solid var(--border)",
            display: "flex", alignItems: "center",
          }}>
            <select
              value={f.category}
              onChange={e => set("category", e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                fontFamily: "'Jost', system-ui, sans-serif", fontSize: 16,
                color: f.category ? "var(--ink)" : "var(--faint)",
                appearance: "none", WebkitAppearance: "none", cursor: "pointer",
              }}
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span style={{ color: "var(--faint)", fontSize: 12, pointerEvents: "none" }}>▾</span>
          </div>
        </div>
        {/* Quantity + Expiry */}
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ width: 155 }}><QtyStepper value={f.quantity} onChange={v => set("quantity", v)} /></div>
          <div style={{ flex: 1 }}><DateField value={f.expiryDate} onChange={v => set("expiryDate", v)} /></div>
        </div>

        {/* Packaging type dropdown */}
        <SelectField label="Packaging type" value={f.packagingTag} onChange={v => set("packagingTag", v)} options={PACKAGING_TAGS} placeholder="Select packaging type…" />

        {/* Pack size + Nutriscore */}
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <TextField label="Pack size" value={f.packSize} onChange={v => set("packSize", v)} placeholder="e.g. 400g, 250ml" />
          </div>
          <div style={{ flex: 1 }}>
            <SelectField label="Nutri-score" value={f.nutriscoreGrade} onChange={v => set("nutriscoreGrade", v)} options={NUTRISCORE_GRADES} placeholder="N/A" />
          </div>
        </div>

        {/* Labels */}
        <TextField label="Labels" value={f.labelTags} onChange={v => set("labelTags", v)} placeholder="e.g. Vegan, Organic" />

        {/* Product image */}
        {f.imageUrl && (
          <div>
            <FieldLabel>Product photo</FieldLabel>
            <div style={{ borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--field-bg)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 140 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.imageUrl} alt={f.name} style={{ maxHeight: 200, maxWidth: "100%", objectFit: "contain", display: "block" }} />
            </div>
          </div>
        )}
      </form>

      {/* Sticky save */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, padding: "14px 20px 36px",
        background: "linear-gradient(to top, var(--bg) 60%, transparent)",
        maxWidth: 480, margin: "0 auto",
      }}>
        <button type="button" onClick={submit} disabled={!valid || saving} style={{
          width: "100%", height: 54, borderRadius: 999, border: "none",
          cursor: valid && !saving ? "pointer" : "default",
          background: valid ? "var(--accent)" : "var(--surface-2)",
          color: valid ? "var(--accent-ink)" : "var(--faint)",
          fontFamily: "'Jost', system-ui, sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: -0.1,
          boxShadow: valid ? "var(--shadow)" : "none",
        }}>
          {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Save to pantry"}
        </button>
      </div>
    </div>
  );
}
