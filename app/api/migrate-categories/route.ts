import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const RULES: [RegExp, string][] = [
  [/dairi|dairy|milk|milch|cheese|yog|joghurt|butter|cream|quark|egg/i, "Dairy & eggs"],
  [/pasta|grain|rice|noodle|penne|cereal|oat|couscous|bread|starch/i,   "Grains & pasta"],
  [/legume|bean|chickpea|lentil|pea\b/i,                                "Legumes"],
  [/condiment|sauce|harissa|paste|ketchup|mustard|spice|herb|salt|pepper|vinegar|seasoning|dressing/i, "Herbs & spices"],
  [/cook|oil|olive|stock|broth|coconut|soup|tin|canned|cooking/i,       "Cooking staples"],
  [/snack|chip|crisp|cookie|biscuit|chocolate|sweet|candy|nut/i,        "Snacks & sweets"],
  [/bever|drink|juice|water|soda|tea|coffee|cola|smoothie/i,            "Drinks"],
  [/bak|sugar|yeast|baking|vanilla|cocoa/i,                             "Baking"],
  [/produce|fruit|veg|vegetable|apple|tomato\b/i,                       "Fresh produce"],
  [/protein|meat|fish|poultry|egg|seafood/i,                            "Meat & fish"],
];

function friendlyName(raw: string | null): string | null {
  if (!raw) return null;
  const c = raw.toLowerCase();
  for (const [re, name] of RULES) if (re.test(c)) return name;
  return "Others";
}

export async function GET() {
  const items = await prisma.item.findMany({ where: { consumedAt: null } });
  const updates: { id: number; from: string | null; to: string | null }[] = [];

  for (const item of items) {
    const friendly = friendlyName(item.category);
    if (friendly && friendly !== item.category) {
      await prisma.item.update({ where: { id: item.id }, data: { category: friendly } });
      updates.push({ id: item.id, from: item.category, to: friendly });
    }
  }

  return NextResponse.json({ updated: updates.length, changes: updates });
}
