import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendExpiryEmail } from "@/lib/email";

// Called daily by the cron job — also callable manually at /api/cron
export async function GET() {
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const expiring = await prisma.item.findMany({
    where: {
      consumedAt: null,
      expiryDate: { lte: in30Days, gte: new Date() },
    },
    orderBy: { expiryDate: "asc" },
  });

  if (expiring.length === 0) {
    return NextResponse.json({ sent: false, reason: "nothing expiring soon" });
  }

  const items = expiring.map((i) => ({
    name: i.name,
    expiryDate: i.expiryDate!,
    daysLeft: Math.ceil(
      (i.expiryDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ),
  }));

  await sendExpiryEmail(items);
  return NextResponse.json({ sent: true, count: items.length });
}
