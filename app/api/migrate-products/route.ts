import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PKG_TAG_MAP: Record<string, string> = {
  "tetra-pak": "Tetra Pak", "tetra-brik": "Tetra Pak", "tetra-brik-aseptic": "Tetra Pak",
  "glass": "Glass jar", "glass-jar": "Glass jar", "glass-bottle": "Glass bottle",
  "metal": "Metal can", "metal-can": "Metal can", "tin": "Metal can",
  "can": "Metal can", "aluminium-can": "Metal can",
  "plastic-bag": "Plastic bag", "bag": "Plastic bag",
  "cardboard": "Cardboard box", "cardboard-box": "Cardboard box",
  "paper-bag": "Paper bag", "paper": "Paper bag",
  "plastic-bottle": "Plastic bottle", "bottle": "Plastic bottle",
  "plastic-tub": "Plastic tub", "tub": "Plastic tub",
  "tube": "Tube", "sachet": "Sachet", "pouch": "Pouch",
  "vacuum-pack": "Vacuum pack", "multilayer-composite": "Multilayer composite",
};

const LABEL_KEEP = ["vegan", "vegetarian", "organic", "halal", "kosher", "fair-trade", "gluten-free", "no-gluten", "no-gmos", "bio"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parse(p: any) {
  const pkgTags: string[] = p.packaging_tags ?? [];
  let packagingTag = "";
  for (const tag of pkgTags) {
    const key = tag.replace(/^[a-z]{2}:/, "").toLowerCase();
    if (PKG_TAG_MAP[key]) { packagingTag = PKG_TAG_MAP[key]; break; }
  }

  const labelRaw: string[] = p.labels_tags ?? [];
  const labelTags = labelRaw
    .map((t: string) => t.replace(/^[a-z]{2}:/, ""))
    .filter((t: string) => LABEL_KEEP.some(k => t.includes(k)))
    .map((t: string) => t.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()))
    .join(", ");

  const grade = p.nutriscore_grade as string | undefined;
  const nutriscoreGrade = grade && grade !== "unknown" && grade !== "not-applicable"
    ? grade.toUpperCase() : "";

  return {
    packagingTag:    packagingTag || null,
    packSize:        (p.quantity as string | undefined) || null,
    nutriscoreGrade: nutriscoreGrade || null,
    labelTags:       labelTags || null,
    imageUrl:        (p.image_front_url as string | undefined) || null,
  };
}

export async function GET() {
  const items = await prisma.item.findMany({
    where: { barcode: { not: null } },
  });

  const results: { id: number; barcode: string; status: string }[] = [];

  for (const item of items) {
    if (!item.barcode) continue;
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${item.barcode}.json`);
      const data = await res.json();
      if (data.status !== 1) { results.push({ id: item.id, barcode: item.barcode, status: "not found" }); continue; }
      const updates = parse(data.product);
      await prisma.item.update({ where: { id: item.id }, data: updates });
      results.push({ id: item.id, barcode: item.barcode, status: "updated" });
    } catch {
      results.push({ id: item.id, barcode: item.barcode, status: "error" });
    }
  }

  return NextResponse.json({ total: items.length, results });
}
