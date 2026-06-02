"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ItemForm, type FormState } from "@/lib/ItemForm";

export default function EditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<FormState | null>(null);

  useEffect(() => {
    fetch("/api/items")
      .then(r => r.json())
      .then((items) => {
        const item = items.find((i: { id: number }) => i.id === Number(id));
        if (!item) { router.push("/"); return; }
        setInitial({
          name:            item.name ?? "",
          brand:           item.brand ?? "",
          barcode:         item.barcode ?? "",
          category:        item.category ?? "",
          packaging:       item.packaging ?? "",
          packagingTag:    item.packagingTag ?? "",
          packSize:        item.packSize ?? "",
          nutriscoreGrade: item.nutriscoreGrade ?? "",
          labelTags:       item.labelTags ?? "",
          imageUrl:        item.imageUrl ?? "",
          quantity:        item.quantity ?? 1,
          expiryDate:      item.expiryDate
            ? new Date(item.expiryDate).toISOString().split("T")[0]
            : "",
        });
      });
  }, [id, router]);

  async function onSave(data: FormState) {
    await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, expiryDate: data.expiryDate || null }),
    });
    router.push("/");
  }

  if (!initial) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--faint)", fontSize: 14 }}>Loading…</p>
    </div>
  );

  return <ItemForm mode="edit" initial={initial} onSave={onSave} />;
}
