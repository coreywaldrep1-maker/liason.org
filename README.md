# Liaison — Bulletproof Vercel Starter

A minimal, brand-ready Next.js App Router project for **Liaison** (liaison.com). No Tailwind/PostCSS/TypeScript required — deploys cleanly on Vercel out of the box.

## Features
- App Router (Next 14)
- Static, server-safe pages: `/`, `/visas`, `/policies`, `/dpa`
- Dynamic routes: `/flow/[country]/[visa]`, `/checkout/[country]/[visa]`
- No client hooks in server pages (no hydration crashes)
- Simple CSS (`app/globals.css`), no PostCSS config
- PayPal guarded (no env var = friendly message, not a crash)
- Brand assets in `/public`

## Quick start
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy to Vercel
1) Create a new GitHub repo and push this folder.
2) In Vercel: **New Project** → import your repo → Framework: **Next.js** → Build command: `next build` (default).
3) Click **Deploy**. Use the `.vercel.app` URL immediately.

## Custom domain
In Vercel → Project → **Settings → Domains → Add** your domain (e.g., liaison.com). If your registrar is external:
- Apex A record → `76.76.21.21`
- `www` CNAME → `cname.vercel-dns.com`

## Configure PayPal (optional)
In Vercel → **Settings → Environment Variables**:
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID = <LIVE client id>`

Redeploy; the checkout page will reflect availability. (Buttons intentionally omitted to keep the starter bulletproof.)

## Notes
- All styling is in `app/globals.css` for simplicity.
- No analytics, no scripts, no providers — add as needed.
- To add languages later, create dedicated route groups or a client-only i18n header.