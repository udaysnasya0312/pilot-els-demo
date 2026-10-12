# Pilot Adoption-ELS — UI Demo (deploy to Vercel)

Static site. No build step, no config needed. Entry page: `index.html` (Status dashboard).
Pages: index (Status) · setup · administration · support · userProfile · login.

## Option A — Vercel CLI (fastest)
```bash
cd Pilot_UI_stitch
npx vercel         # first run asks you to log in (email/GitHub), then deploys a preview
npx vercel --prod  # promote to a public production URL
```
Copy the printed URL and share it.

## Option B — Drag & drop (no CLI)
1. Go to https://vercel.com/new  (log in).
2. Drag the whole `Pilot_UI_stitch` folder onto the page.
3. Click Deploy → copy the URL.

## Notes
- The UI loads Tailwind + Google Fonts from their CDNs, so it needs internet (fine for a web demo).
- All data is dummy/static for demonstration — no backend, no CGI calls.
- To make the demo open on the Login screen first, rename files: `index.html` → `status.html` won't be needed; instead copy `login.html` to a new `index.html` — ask me and I'll switch it.
