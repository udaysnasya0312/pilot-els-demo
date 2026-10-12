# Pilot Adoption-ELS — Stitch UI demo

Static site, no build step. Entry `/` → `login.html` → `system/index.html` (Dashboard).
All data is dummy (copied from the real screens); no backend, no CGI calls.

## Stack — same as the real CGI box, 100% local, NO CDN
- Bootstrap **4.0.0** + jQuery 3.4.1 + Popper (copied from the real project's `css/External` / `js/External`)
- FontAwesome 5.11.2 (same version the real box ships)
- ONE theme file `assets/pilot-theme.css` = the whole Stitch look (DESIGN.md tokens). No Tailwind, no build step.
- Fonts Inter + JetBrains Mono self-hosted in `assets/vendor/fonts/` (OFL licence)
- Works offline (verified: no external URLs in any page or asset)

## Structure
```
index.html                 redirect -> login.html
login.html                 login only (any non-empty user/password -> dashboard)
system/<page>.html         same file names as the real CGI system/ folder
assets/pilot-theme.css     the look (load AFTER bootstrap.min.css)
assets/shell.js            sidebar + top bar for every system page (navigation lives here only)
assets/setup-tabs.js       SetUp tab bar + Previous / Next
assets/ui.js               toasts + password reveal (modals = Bootstrap data-toggle="modal")
assets/img/                logo-home.svg, adoption.png, blue-icon.png (from the real zip)
assets/vendor/             bootstrap/, jquery/, fontawesome/, fonts/
```

### Port-back to the real CGI
1. Copy `assets/pilot-theme.css` + `assets/vendor/fonts/` next to the real `css/`; link it after `bootstrap.min.css`.
2. Bootstrap 4.0 has no `flex-grow-*`, `gap`, or switches — the theme provides `.flex-1`, `.gap-*`, `.pp-switch`.
3. Swap each page's markup for the new one, keeping the real element ids, then re-attach the real scripts (see table).

## Deploy (Vercel)
```bash
cd Pilot_UI_stitch
npx vercel          # preview
npx vercel --prod   # production URL
```
Keep the GitHub repo private.

## Differences from the real CGI setup (must be fixed before port-back)
| # | Demo | Real CGI box | Port-back action |
|---|------|--------------|------------------|
| 1 | ~~Tailwind CDN~~ **RESOLVED** — now Bootstrap 4.0.0 + `pilot-theme.css`, all local | Bootstrap 4, local only, no CDN | — |
| 2 | ~~Google Fonts CDN~~ **RESOLVED** — Inter / JetBrains Mono self-hosted | System/Bootstrap fonts | Copy `assets/vendor/fonts/` (or drop the fonts) |
| 3 | jQuery 3.4.1 + Bootstrap 4.0 JS loaded (modals); real page scripts not attached | jQuery 3.4.1 + Bootstrap 4 + Mustache + Plotly | Re-attach real page scripts (`securePage.js`, `index.js`, …) |
| 4 | Sidebar + top bar injected by `assets/shell.js` | Top navbar copied into every page | Either keep shell.js (plain JS, no deps) or paste the markup per page |
| 5 | Static dummy values | Values from `cgi/cgi_*.py` via ajax | Bind the real ajax responses into the new markup |
| 6 | Login is a redirect (no auth) | `devScripts/login.js` + CGI auth, lockout via SweetAlert | Restore real login script |
| 7 | Nav labels: "Dashboard" = `index.html`, "Status" = `status.html`; SetUp sub-pages (Connection, Module Control, Calibration, Debug) as a tab bar inside SetUp | Top nav Administration / Status / SetUp / Support; SetUp sub-pages are tabs; Calibration/Debug are tab-disabled until unlocked | Confirm naming; re-apply the disabled-tab rule |
| 8 | Memory usage bar | Text only (Total / Used / Free) | Bar width = Used ÷ Total, computed from the same values |
| 9 | Time-zone picker has 4 sample zones | Zone list loaded from the device | Load the real list |

### Status page (`system/status.html`)
| # | Demo | Real | Port-back action |
|---|------|------|------------------|
| S1 | Chart = small inline SVG, generated dummy series | Local Highcharts (`Plugins/Highcharts`) fed by RRD data via `CollectDCharts.js` | Keep Highcharts; apply the new colours/fonts to its theme |
| S2 | Status panel icons = FontAwesome | PNG icons (`images/Ethernet-Connection.png`, `TEC.png`, …) | Either is local; pick one |
| S3 | TEC list shows TEC 1–16 (assumed one TEC per laser, as Module Control pairs them; dummy) | Rows from the `TEC` table | Bound from real data |
| S4 | Status panel always visible (stacks below on mobile) | Desktop column + mobile slide-out drawer (`sideStatusResp`) | Optional: keep the drawer on mobile |
| S5 | Rocker / Key Switch shown as read-only OFF pills | Disabled toggle switches | Same meaning, different control |
| S6 | Turn All Outputs / Module OFF toggles change state visually only | Toggles call the CGI (disabled until permitted) | Re-attach real handlers + disabled rule |

### Other pages
| # | Page | Demo | Real | Port-back action |
|---|------|------|------|------------------|
| P1 | All | Save / Upload / Send buttons show a toast ("Updated Successfully!") — no CGI call | CGI ajax + SweetAlert | Re-attach real handlers |
| P2 | SetUp | Tab bar (`assets/setup-tabs.js`): Connection, Module Control, Calibration, Debug — all clickable | Calibration & Debug tabs disabled until unlocked | Re-apply disabled-tab rule |
| P3 | Connection / My Profile | Passwords show a dummy masked value | Real stored values (screenshots showed plain-text passwords) | Never ship real credentials in a demo |
| P4 | My Profile | Phone = simple country-code select | intl-tel-input plugin with flags | Keep the plugin or the select |
| P5 | Module Control | General (TEC n) + Current Controller (Laser n) CLUBBED into one accordion per channel, one Save for both; ranges from real screen (Temp 10–60 °C, set 25.00; Current 0–210 mA); values dummy | Two separate accordions (General, Current Controller), each row saved on its own | Restructure markup; keep real labels/ids |
| P6 | Calibration | "Idle / Calibrating…" status pill added | Not on the real page | Remove or keep (new) |
| P7 | Debug | 4 iDAC + 4 vDAC rows (count assumed); range dropdown = real option list | Rows from `i_dac_data` / `v_dac_data` | Bind real data |
| P9 | View Logs | Dummy log rows; Log Type filter works client-side | `cgi_CCMLogs.py` (same columns) | Bind real data |
| P10 | Support | Same dialogs/texts as real ("In progress...", "Not Implemented") | Same | — |

### UI additions (not on the real site)
| # | Item | Notes |
|---|------|-------|
| U1 | Sidebar open/close: desktop 240px <-> 64px icon rail (tooltips), mobile slide-in | `assets/shell.js` + theme; state in `localStorage` key `pp-sidebar-collapsed` (per browser) |
| U2 | Login background animation (light pulses on laser paths, pinging sensor nodes, scan sweep, drifting glows) | Pure CSS/SVG, local; off for `prefers-reduced-motion` |

