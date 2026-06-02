# 🥘 Pantry Tracker

> A self-hosted, mobile-first PWA that scans barcodes, tracks expiry dates, and keeps your pantry under control.

[![Build](https://github.com/judkacag/pantry-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/judkacag/pantry-tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Made in Berlin](https://img.shields.io/badge/Made%20in-Berlin%20🇩🇪-red)](https://en.wikipedia.org/wiki/Berlin)

---

## Why

I kept throwing out food that had quietly expired at the back of the cupboard. I looked at existing tools but they were more than I needed, so I built a simple version that covers my current use case: scan something when it goes in, and see at a glance what needs using up.

---

## What it does

| Feature | Detail |
|---|---|
| **Barcode scan** | Point your phone camera at any product — name, brand, category, pack size, nutri-score and product photo are auto-filled from Open Food Facts |
| **Expiry tracking** | Colour-coded urgency groups: expired · expiring soon · use this month · plenty of time |
| **Consume or delete** | Swipe left to reveal Used / Delete — deducts quantity when you have more than one |
| **Search & filter** | Instant search + multi-select filter by urgency and category |
| **Group views** | Switch between Urgency, Category, and All items |
| **PWA** | Install to your home screen — works like a native app, no App Store needed |

---

## Architecture

<img src="docs/architecture.svg" width="100%"/>

Two zones:
- **Your phone** — browser PWA with camera barcode scanning via `html5-qrcode`
- **Next.js app** — API routes, SQLite database, all logic stays local
- **External** — Open Food Facts (free, no key needed) for product data

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) | Full-stack in one repo, great PWA support |
| Styling | Tailwind CSS + inline styles | Mobile-first, design-system driven |
| Barcode | [html5-qrcode](https://github.com/mebjas/html5-qrcode) | Runs in the browser, no native app needed |
| Product data | [Open Food Facts](https://world.openfoodfacts.org) | Free, open, strong EU coverage |
| Database | SQLite via [Prisma v7](https://www.prisma.io) + libsql | Zero-config, file-based, easy to migrate |
| Font | [Jost](https://fonts.google.com/specimen/Jost) | Clean and readable on mobile |

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

The only required variable is the database path — no external services needed.

```env
DATABASE_URL="file:./prisma/dev.db"
```

### 3. Set up the database

```bash
npx prisma migrate dev
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On mobile, connect to the same WiFi and use your machine's local IP — e.g. `https://192.168.0.41:3000`.

> **Note:** Camera access for barcode scanning requires HTTPS. Run with `next dev --experimental-https` for mobile testing.

---

## Roadmap

- [x] Barcode scan → Open Food Facts auto-fill (name, brand, category, pack size, nutri-score, photo)
- [x] Expiry tracking with colour-coded urgency groups
- [x] Swipe to consume / delete with quantity deduction
- [x] Search + filter by urgency and category
- [x] PWA / installable on mobile
- [ ] Fridge as a second storage location
- [ ] Shared household access (multi-user)
- [ ] Cloud deploy on Hetzner with Tailscale

---

## License

[MIT](LICENSE) · Built by [Judit Bekker](https://github.com/judkacag) with [Claude Code](https://claude.ai/code)
