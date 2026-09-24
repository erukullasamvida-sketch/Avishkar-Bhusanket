# LandslideGuard — AI Landslide Early Warning Portal (NE India)

A government-style monitoring portal with login, dashboard, live risk map, AI prediction demo, alerts, field reports, analytics, data sources and settings — backed by Lovable Cloud (database, storage, logins) with seeded demo data for Assam / NE India.

## Look and feel
- Dark navy side navigation, crisp light content area, forest-green accent.
- Risk colours: green Low (0.00–0.30), amber Moderate (0.31–0.55), orange High (0.56–0.75), red Critical (0.76–1.00).
- No neon, glass or 3D effects. Dense, practical, table-and-card layout like the reference sheet.
- Fully responsive: sidebar collapses to a drawer, bottom navigation bar on phones.

## Pages
1. **Login / Sign up** — email + password, plus three one-tap Demo Login buttons (Admin, Disaster Management Officer, Field Officer) so evaluators enter instantly.
2. **Dashboard** — four KPI cards (56 monitored areas, 7 high risk, 2 critical, 82 mm rainfall), risk map widget, recent alerts, priority risk areas list linking into details.
3. **Risk Map** — full interactive map (Leaflet + OpenStreetMap) with search, district and risk-level filters, layer toggles (risk zones, rainfall, soil moisture, slope, historical landslides, roads), marker popups with score and factors.
4. **Risk Details** — score gauge, key factors (rainfall, soil moisture, slope, elevation), nearby villages, 7-day trend chart, recent field reports, actions: View on Map, Create Alert, Assign Response.
5. **AI Prediction** — region, window (24h/48h/7d) and model selectors, Run Analysis simulation, results table with predicted risk, probability and confidence, contributing-factor breakdown, trend chart, and a clear demo-model disclaimer banner.
6. **Alerts** — filter tabs (All, Critical, High, Moderate, Resolved), severity cards, working Acknowledge and Resolve actions saved to the database.
7. **Field Reports** — location, report type, severity, description and photo upload; saves the report and stores the photo; recent reports feed with status badges; phone-friendly.
8. **Analytics & Reports** — risk distribution donut, rainfall trend, risk trend over time, Top 5 high-risk areas table.
9. **Data Sources** — connection status monitors for weather, rainfall radar, soil sensors, satellite, terrain and historical data.
10. **Settings** — profile, system preferences, notification toggles, language selector (English, Hindi, Assamese, Bengali).

## Data and backend
Enable Lovable Cloud, then create tables: profiles, risk_locations, risk_history, alerts, field_reports, predictions, data_sources, settings — each with row-level security so users only touch their own records, plus public read for monitoring data. A storage bucket holds field-report photos. Seed realistic demo rows for Dima Hasao, Haflong, Maibong, Umrangso, Karbi Anglong and more, including 7 days of history, alerts, predictions and sample reports.

Every page also keeps a bundled copy of the demo data, so if the network stalls during a live demo the screens still render.

## Technical notes
- TanStack Start routes: public `/` (login/signup) and gated app routes under the authenticated layout.
- Leaflet loaded client-side only (dynamic import behind a client-only boundary) to keep server rendering working.
- Charts with Recharts; risk colours as design tokens in the stylesheet.
- Reads via server functions/queries with a static fallback dataset when a query fails.
- Demo Login creates/uses fixed demo accounts with auto-confirm so the button works immediately.

## Build order
1. Enable Cloud, migrations + seed data + storage bucket.
2. Design tokens, app shell (sidebar, topbar, mobile bottom nav).
3. Auth + demo login.
4. Dashboard, Risk Map, Risk Details.
5. AI Prediction, Alerts, Field Reports.
6. Analytics, Data Sources, Settings.
7. Responsive pass and per-page titles/descriptions.
