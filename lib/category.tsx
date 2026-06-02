type CatMeta = { emoji: string; bg: string };

const CATEGORY_META: [RegExp, CatMeta][] = [
  [/dairi|dairy|milk|milch|cheese|yog|joghurt|butter|cream|quark/i,                                     { emoji: "🥛", bg: "#E4EDF1" }],
  [/pasta|grain|rice|noodle|penne|cereal|oat|couscous|bread|starch/i,                                   { emoji: "🌾", bg: "#F1E7CD" }],
  [/legume|bean|chickpea|lentil|pea\b/i,                                                                 { emoji: "🫘", bg: "#EADDCB" }],
  [/condiment|sauce|harissa|paste|ketchup|mustard|spice|herb|salt|pepper|vinegar|seasoning|dressing/i,   { emoji: "🧂", bg: "#F4DAD0" }],
  [/cook|oil|olive|stock|broth|coconut|soup|tin|canned|cooking/i,                                        { emoji: "🥘", bg: "#F6E3C4" }],
  [/snack|chip|crisp|cookie|biscuit|chocolate|sweet|candy|nut/i,                                         { emoji: "🍪", bg: "#EFE0CE" }],
  [/bever|drink|juice|water|soda|tea|coffee|cola|smoothie/i,                                             { emoji: "🥤", bg: "#E0EAE6" }],
  [/bak|sugar|yeast|baking|vanilla|cocoa/i,                                                              { emoji: "🧁", bg: "#F2DEE2" }],
  [/produce|fruit|veg|vegetable|apple|tomato\b/i,                                                        { emoji: "🥬", bg: "#E6EDD6" }],
  [/protein|meat|fish|poultry|egg|seafood/i,                                                             { emoji: "🥩", bg: "#FDECEA" }],
];
const DEFAULT_META: CatMeta = { emoji: "🧺", bg: "#ECE6DA" };

export function categoryMeta(category: string | null): CatMeta {
  const c = (category ?? "").toLowerCase();
  for (const [re, m] of CATEGORY_META) if (re.test(c)) return m;
  return DEFAULT_META;
}

export function CategoryIcon({ category, size = 22 }: { category: string | null; size?: number }) {
  const m = categoryMeta(category);
  const boxSize = size + 18;
  return (
    <div style={{
      width: boxSize, height: boxSize, borderRadius: 12, flexShrink: 0,
      background: m.bg, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontSize: size * 0.95, lineHeight: 1 }}>{m.emoji}</span>
    </div>
  );
}
