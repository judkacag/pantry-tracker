import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const item = await prisma.item.update({
    where: { id: Number(id) },
    data: {
      ...(body.consumedAt !== undefined && {
        consumedAt: body.consumedAt ? new Date(body.consumedAt) : null,
      }),
      ...(body.quantity !== undefined && { quantity: body.quantity }),
    },
  });
  return NextResponse.json(item);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const item = await prisma.item.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      brand: body.brand ?? null,
      barcode: body.barcode ?? null,
      category: body.category ?? null,
      packaging: body.packaging ?? null,
      location: body.location ?? "pantry",
      quantity: Number(body.quantity) || 1,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.item.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
