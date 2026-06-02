import { NextRequest, NextResponse } from "next/server";

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
    category: p.categories_tags?.[0]?.replace("en:", "") ?? "",
  });
}
