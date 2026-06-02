import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const consumed = req.nextUrl.searchParams.get("consumed") === "true";
  const items = await prisma.item.findMany({
    where: consumed ? { consumedAt: { not: null } } : { consumedAt: null },
    orderBy: consumed ? { consumedAt: "desc" } : { expiryDate: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.item.create({
    data: {
      name: body.name,
      brand: body.brand ?? null,
      barcode: body.barcode ?? null,
      category: body.category ?? null,
      packaging: body.packaging ?? null,
      location: body.location ?? "pantry",
      quantity: body.quantity ?? 1,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
