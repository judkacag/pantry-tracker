import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendExpiryEmail(
  items: { name: string; expiryDate: Date; daysLeft: number }[]
) {
  const rows = items
    .map(
      (i) =>
        `• ${i.name} — expires ${i.expiryDate.toLocaleDateString("de-DE")} (${i.daysLeft} days left)`
    )
    .join("\n");

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL,
    subject: `Pantry reminder: ${items.length} item${items.length > 1 ? "s" : ""} expiring soon`,
    text: `Hi Judit,\n\nThe following pantry items expire within the next 30 days:\n\n${rows}\n\nUse them up!\n\nYour Pantry Tracker`,
  });
}
