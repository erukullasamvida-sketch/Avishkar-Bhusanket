# LandslideGuard NE

Build "LandslideGuard", an AI-based early warning and landslide risk monitoring platform for the North Eastern Region of India (Smart India Hackathon prototype).

Use the attached reference image (sihh.jpeg) as visual inspiration for layout, navigation, spacing, dashboard structure, and responsive design.

Design & Theme:
- Clean, practical government-friendly portal style
- Dark navy sidebar (#0F172A / #1E293B)
- Crisp light content area (#F8FAFC)
- Forest green primary accent (#15803D / #16A34A)
- Risk color tokens: Green = Low (0.00–0.30), Yellow/Amber = Moderate (0.31–0.55), Orange = High (0.56–0.75), Red = Critical (0.76–1.00)
- Avoid neon, glassmorphism, 3D, and excessive decorative visuals

Core Pages & Navigation:
1. Authentication:
   - Login & Sign Up
   - Quick "Demo Login" button (Admin, Disaster Management Officer, Field Officer) so evaluators can instantly enter
2. Dashboard:
   - KPI metric cards: Total Monitored Areas (56), High Risk Areas (7), Critical Areas (2), Recent Rainfall (82 mm)
   - Interactive Risk Map widget showing markers for NE India locations (Dima Hasao, Haflong, Maibong, Umrangso, Karbi Anglong) with risk levels
   - Recent Alerts list with quick action
   - Priority Risk Areas table/list linking directly to Risk Details
3. Risk Map:
   - Interactive GIS map (using Leaflet / React-Leaflet with OpenStreetMap tiles or canvas GIS)
   - Filters: Search location, District, Risk Level
   - Layer toggles: Risk Zones, Rainfall, Soil Moisture, Slope, Historical Landslides, Roads
   - Clickable location markers showing popup with location name, risk score, rainfall, soil moisture, slope, and "View Details" button
4. Risk Details Page:
   - Deep-dive for selected area (e.g. Dima Hasao - High Risk, Score 0.78)
   - Risk score gauge, key factors (Rainfall 120mm, Soil Moisture 32%, Slope 38°, Elevation 600m)
   - Nearby villages, 7-day risk trend chart, recent field reports
   - Action buttons: View on Map, Create Alert, Assign Response
5. AI Prediction:
   - Controls: Region, Prediction Window (24h, 48h, 7 Days), Model selector (LSTM + Random Forest, XGBoost)
   - "Run Analysis" interactive simulation button
   - Prediction results table/cards: Predicted Risk, Probability, Confidence %
   - Contributing factors breakdown and risk trend chart
   - Clear banner: "DEMO AI MODEL — AI predictions support decision-making and do not replace official authority assessment."
6. Alerts:
   - Filters: All, Critical, High, Moderate, Resolved
   - Alert cards with risk score, timestamp, location, and severity badge
   - Working "Acknowledge" and "Resolve" actions updating alert status in Supabase
7. Field Reports:
   - Form: Location, Report Type (Landslide, Ground Crack, Rockfall, Road Blockage, Waterlogging, Slope Instability, Other), Severity (Low, Moderate, High, Critical), Description, Photo upload
   - Submit Report saves to Supabase and stores photos in Supabase Storage
   - Recent reports feed with status badges and timestamps
   - Mobile-friendly layout
8. Analytics & Reports:
   - Risk distribution donut chart, rainfall trend, risk trend over time
   - Top 5 High Risk Areas table (Location, Risk Level, Score, Trend, Last Updated)
9. Data Sources:
   - Connected status monitors for Weather Data, Rainfall Radar, Soil Moisture Sensors, Satellite Feeds, Terrain DEM, Historical Data
10. Settings:
   - Profile/Account, System preferences, Notification toggles (Critical Alerts, Email, SMS), Language selector (English, Hindi, Assamese, Bengali)

Supabase Backend & Demo Data:
- Enable Lovable Cloud / Supabase
- Tables: profiles, risk_locations, risk_history, alerts, field_reports, predictions, data_sources, settings
- Storage bucket for field report photos
- Seed realistic demo data for Assam & NE India locations (Dima Hasao, Haflong, Maibong, Umrangso, Karbi Anglong)
- Simple client-side fallback/offline resilience so the demo never breaks even if network is slow

Ensure full responsive design with a collapsible mobile sidebar / bottom navigation bar.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/845c6865-6187-486a-ab0e-bf9f0dcc7327).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
