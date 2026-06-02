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

// Map raw OFF packaging tags to clean readable labels
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

function derivePackagingTag(p: Record<string, unknown>): string {
  const tags: string[] = (p.packaging_tags as string[] | undefined) ?? [];
  for (const tag of tags) {
    const key = tag.replace(/^[a-z]{2}:/, "").toLowerCase();
    if (PKG_TAG_MAP[key]) return PKG_TAG_MAP[key];
  }
  return "";
}

function deriveLabels(p: Record<string, unknown>): string {
  const tags: string[] = (p.labels_tags as string[] | undefined) ?? [];
  const KEEP = ["vegan", "vegetarian", "organic", "halal", "kosher", "fair-trade", "gluten-free", "no-gluten", "no-gmos", "bio"];
  return tags
    .map(t => t.replace(/^[a-z]{2}:/, ""))
    .filter(t => KEEP.some(k => t.includes(k)))
    .map(t => t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()))
    .join(", ");
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
  const grade = p.nutriscore_grade as string | undefined;

  return NextResponse.json({
    found: true,
    name:            p.product_name_de || p.product_name || p.product_name_en || "",
    brand:           p.brands || "",
    category:        deriveCategory(p),
    packagingTag:    derivePackagingTag(p),
    packSize:        (p.quantity as string | undefined) || "",
    nutriscoreGrade: grade && grade !== "unknown" && grade !== "not-applicable" ? grade.toUpperCase() : "",
    labelTags:       deriveLabels(p),
    imageUrl:        (p.image_front_url as string | undefined) || "",
  });
}
