# 🥫 Pantry Tracker

> A self-hosted, mobile-first PWA that scans barcodes, tracks expiry dates, and emails you before food goes to waste.

[![Build](https://github.com/judkacag/pantry-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/judkacag/pantry-tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Made in Berlin](https://img.shields.io/badge/Made%20in-Berlin%20🇩🇪-red)](https://en.wikipedia.org/wiki/Berlin)

---

## The problem

Food waste is one of those problems that feels small until you add it up — expired cans at the back of the shelf, coconut milk forgotten for a year, chickpeas past their best. I wanted a system that would just tell me what needs eating before it's too late.

Off-the-shelf apps like Grocy are powerful but complex. I wanted something minimal, beautiful on mobile, and fully under my control.

So I built one.

---

## What it does

| Feature | Detail |
|---|---|
| **Barcode scan** | Point your phone camera at any product — name, brand and category are auto-filled from Open Food Facts |
| **Expiry tracking** | Colour-coded badges: 🟢 safe · 🟡 expiring soon · 🔴 urgent |
| **Email alerts** | Daily cron at 08:00 Berlin time — a digest of everything expiring in the next 30 days |
| **Consume or delete** | One tap to mark an item as used or remove it from the inventory |
| **Search & filter** | Instant search across name, brand, category and packaging |
| **PWA** | Install to your home screen — works like a native app, no App Store needed |

---

## Architecture

<img src="docs/architecture.svg" width="100%"/>

Three zones:
- **Your phone** — browser PWA with camera barcode scanning via `html5-qrcode`
- **Next.js app** — four API routes, SQLite database, daily cron job
- **External** — Open Food Facts (free, no key needed) · Gmail SMTP for notifications

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) | Full-stack in one repo, great PWA support |
| Styling | [Tailwind CSS](https://tailwindcss.com) | Rapid mobile-first UI |
| Barcode | [html5-qrcode](https://github.com/mebjas/html5-qrcode) | Runs in the browser, no native app needed |
| Product data | [Open Food Facts](https://world.openfoodfacts.org) | Free, open, strong EU coverage |
| Database | SQLite via [Prisma v7](https://www.prisma.io) + libsql | Zero-config, file-based, easy to migrate |
| Email | [Nodemailer](https://nodemailer.com) + any SMTP | Works with Gmail free tier |
| Scheduler | [node-cron](https://github.com/node-cron/node-cron) | In-process daily job, no external queue |

---

## Getting started

### Prerequisites

- Node.js 20+
- npm

### 1. Clone and install

```bash
git clone https://github.com/judkacag/pantry-tracker.git
cd pantry-tracker
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — for Gmail, [create an App Password](https://myaccount.google.com/apppasswords) (requires 2FA on your Google account).

```env
DATABASE_URL="file:./prisma/dev.db"

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-char-app-password
NOTIFY_EMAIL=you@gmail.com
```

### 3. Set up the database

```bash
npx prisma migrate dev
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On mobile, use your machine's local IP — e.g. `http://192.168.0.41:3000`.

### 5. Test the expiry email

Hit `/api/cron` in your browser to trigger the check manually. Any items expiring within 30 days will trigger an email.

---

## Roadmap

- [x] Barcode scan → Open Food Facts auto-fill
- [x] Expiry tracking with colour-coded badges
- [x] Daily email digest at 08:00 Berlin time
- [x] PWA / installable on mobile
- [ ] Fridge as a second storage location
- [ ] Shared household access (multi-user)
- [ ] Cloud deploy on Hetzner with Tailscale
- [ ] Photo-based expiry date OCR
- [ ] Shopping list from low / empty items

---

## Contributing

Issues and PRs are welcome. Please open an issue first for anything beyond small fixes.

---

## License

[MIT](LICENSE) · Built by [Judit Bekker](https://github.com/judkacag) with [Claude Code](https://claude.ai/code)
