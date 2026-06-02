import { NextRequest, NextResponse } from "next/server";

const PNNS_MAP: Record<string, string> = {
  "Fruits and vegetables":        "Fruits & vegetables",
  "Milk and dairy products":      "Dairy & eggs",
  "Fish Meat Eggs":               "Protein",
  "Fish and seafood":             "Protein",
  "Legumes":                      "Legumes",
  "Cereals and potatoes":         "Grains & starches",
  "Fats and sauces":              "Condiments & sauces",
  "Sugary snacks":                "Snacks & sweets",
  "Salty snacks":                 "Snacks & sweets",
  "Beverages":                    "Drinks",
  "Alcoholic beverages":          "Drinks",
  "Composite foods":              "Ready meals",
};

const SPICE_TAGS = ["spice", "herb", "seasoning", "condiment", "sauce", "vinegar", "mustard", "ketchup", "dressing"];
const BAKING_TAGS = ["baking", "flour", "sugar", "yeast", "vanilla", "cocoa", "chocolate"];
const OIL_TAGS = ["oil", "olive-oil", "vegetable-oil"];

function deriveCategory(p: Record<string, unknown>): string {
  // 1. PNNS group (most reliable)
  const pnns = p.pnns_groups_1 as string | undefined;
  if (pnns && PNNS_MAP[pnns]) return PNNS_MAP[pnns];

  // 2. Keyword match on categories_tags for gaps PNNS doesn't cover
  const tags: string[] = (p.categories_tags as string[] | undefined) ?? [];
  const tagStr = tags.join(" ").toLowerCase();

  if (OIL_TAGS.some((k) => tagStr.includes(k)))    return "Oils & fats";
  if (SPICE_TAGS.some((k) => tagStr.includes(k)))  return "Herbs & spices";
  if (BAKING_TAGS.some((k) => tagStr.includes(k))) return "Baking";

  return "Others";
}

export async function GET(req: NextRequest) {
  const barcode = req.nextUrl.searchParams.get("barcode");
  if (!barcode) return NextResponse.json({ error: "barcode required" }, { status: 400 });

  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
    { next: { revalidate: 86400 } }
  );
  const data = await res.json();

  if (data.status !== 1) return NextResponse.json({ found: false });

  const p = data.product;
  return NextResponse.json({
    found: true,
    name: p.product_name_de || p.product_name || p.product_name_en || "",
    brand: p.brands || "",
    category: deriveCategory(p),
  });
}
