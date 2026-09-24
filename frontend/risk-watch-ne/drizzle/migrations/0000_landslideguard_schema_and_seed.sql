-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT NOT NULL DEFAULT 'Officer',
  role TEXT NOT NULL DEFAULT 'field_officer',
  organization TEXT DEFAULT 'NE Disaster Management Authority',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email,'officer@ne.gov.in'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'field_officer')
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- SETTINGS
CREATE TABLE public.settings (
  user_id UUID PRIMARY KEY,
  critical_alerts BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  sms_notifications BOOLEAN NOT NULL DEFAULT false,
  realtime_alerts BOOLEAN NOT NULL DEFAULT true,
  language TEXT NOT NULL DEFAULT 'en',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RISK LOCATIONS
CREATE TABLE public.risk_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Assam',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  risk_score NUMERIC(3,2) NOT NULL DEFAULT 0.20,
  rainfall_24h NUMERIC(6,1) NOT NULL DEFAULT 0,
  soil_moisture NUMERIC(5,1) NOT NULL DEFAULT 0,
  slope_angle NUMERIC(5,1) NOT NULL DEFAULT 0,
  elevation NUMERIC(7,1) NOT NULL DEFAULT 0,
  land_cover TEXT NOT NULL DEFAULT 'Forest / Sparse',
  population INTEGER NOT NULL DEFAULT 0,
  nearby_villages TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.risk_locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_locations TO authenticated;
GRANT ALL ON public.risk_locations TO service_role;
ALTER TABLE public.risk_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk locations public read" ON public.risk_locations FOR SELECT TO anon, authenticated USING (true);

-- RISK HISTORY
CREATE TABLE public.risk_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.risk_locations(id) ON DELETE CASCADE,
  recorded_on DATE NOT NULL,
  risk_score NUMERIC(3,2) NOT NULL,
  rainfall NUMERIC(6,1) NOT NULL DEFAULT 0
);
GRANT SELECT ON public.risk_history TO anon;
GRANT SELECT, INSERT ON public.risk_history TO authenticated;
GRANT ALL ON public.risk_history TO service_role;
ALTER TABLE public.risk_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk history public read" ON public.risk_history FOR SELECT TO anon, authenticated USING (true);

-- ALERTS
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.risk_locations(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'moderate',
  risk_score NUMERIC(3,2) NOT NULL DEFAULT 0,
  predicted_in TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.alerts TO anon;
GRANT SELECT, INSERT, UPDATE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts public read" ON public.alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "alerts insert by authenticated" ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "alerts update by authenticated" ON public.alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- FIELD REPORTS
CREATE TABLE public.field_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  location_id UUID REFERENCES public.risk_locations(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate',
  description TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  gps_latitude DOUBLE PRECISION,
  gps_longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'pending',
  reporter_name TEXT NOT NULL DEFAULT 'Field Officer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.field_reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_reports TO authenticated;
GRANT ALL ON public.field_reports TO service_role;
ALTER TABLE public.field_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "field reports public read" ON public.field_reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "field reports insert own" ON public.field_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "field reports update own" ON public.field_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "field reports delete own" ON public.field_reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PREDICTIONS
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.risk_locations(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'LSTM + Random Forest',
  prediction_window TEXT NOT NULL DEFAULT '7d',
  predicted_risk TEXT NOT NULL DEFAULT 'moderate',
  probability NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  confidence NUMERIC(4,1) NOT NULL DEFAULT 85.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.predictions TO anon;
GRANT SELECT, INSERT ON public.predictions TO authenticated;
GRANT ALL ON public.predictions TO service_role;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predictions public read" ON public.predictions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "predictions insert by authenticated" ON public.predictions FOR INSERT TO authenticated WITH CHECK (true);

-- DATA SOURCES
CREATE TABLE public.data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'weather',
  status TEXT NOT NULL DEFAULT 'connected',
  latency_ms INTEGER NOT NULL DEFAULT 120,
  refresh_interval TEXT NOT NULL DEFAULT '15 min',
  last_sync TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT NOT NULL DEFAULT ''
);
GRANT SELECT ON public.data_sources TO anon;
GRANT SELECT, UPDATE ON public.data_sources TO authenticated;
GRANT ALL ON public.data_sources TO service_role;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "data sources public read" ON public.data_sources FOR SELECT TO anon, authenticated USING (true);

-- ============ SEED DATA ============
INSERT INTO public.risk_locations (id, name, district, state, latitude, longitude, risk_score, rainfall_24h, soil_moisture, slope_angle, elevation, land_cover, population, nearby_villages) VALUES
('11111111-1111-4111-8111-000000000001','Dima Hasao','Dima Hasao','Assam',25.6000,93.1700,0.78,120.0,32.0,38.0,600.0,'Forest / Sparse',14200,'Haflong, Maibong, Harangajao'),
('11111111-1111-4111-8111-000000000002','Haflong','Dima Hasao','Assam',25.1650,93.0170,0.67,104.0,29.5,34.0,680.0,'Hill Forest',44000,'Jatinga, Mahur, Harangajao'),
('11111111-1111-4111-8111-000000000003','Maibong','Dima Hasao','Assam',25.3000,93.1300,0.73,112.0,31.0,36.5,420.0,'Mixed Forest',9800,'Langting, Dittokcherra'),
('11111111-1111-4111-8111-000000000004','Umrangso','Dima Hasao','Assam',25.5300,92.7000,0.41,68.0,22.0,24.0,380.0,'Grass / Shrub',12500,'Kalyani, Garampani'),
('11111111-1111-4111-8111-000000000005','Karbi Anglong','Karbi Anglong','Assam',26.0000,93.5000,0.58,88.0,26.5,29.0,520.0,'Forest / Sparse',31000,'Diphu, Bokajan, Howraghat'),
('11111111-1111-4111-8111-000000000006','Sivasagar','Sivasagar','Assam',26.9850,94.6400,0.82,142.0,36.0,31.0,300.0,'Agriculture / Slope',52000,'Nazira, Amguri'),
('11111111-1111-4111-8111-000000000007','Jatinga','Dima Hasao','Assam',25.0900,92.9800,0.54,76.0,25.0,27.5,750.0,'Hill Forest',3200,'Haflong, Harangajao'),
('11111111-1111-4111-8111-000000000008','Cachar','Cachar','Assam',24.8300,92.7800,0.63,96.0,28.0,22.0,220.0,'Agriculture',60000,'Silchar, Lakhipur'),
('11111111-1111-4111-8111-000000000009','Diphu','Karbi Anglong','Assam',25.8400,93.4300,0.36,54.0,19.0,18.5,186.0,'Urban / Mixed',65000,'Manja, Dokmoka'),
('11111111-1111-4111-8111-000000000010','Tamenglong','Tamenglong','Manipur',24.9800,93.5100,0.49,72.0,24.0,33.0,1260.0,'Dense Forest',8600,'Nungba, Khoupum'),
('11111111-1111-4111-8111-000000000011','Aizawl Hills','Aizawl','Mizoram',23.7300,92.7200,0.71,118.0,30.5,40.0,1130.0,'Hill Forest',29300,'Durtlang, Sairang'),
('11111111-1111-4111-8111-000000000012','Cherrapunji','East Khasi Hills','Meghalaya',25.3000,91.7000,0.69,168.0,34.0,37.0,1430.0,'Plateau / Grass',14800,'Mawsynram, Sohra');

INSERT INTO public.risk_history (location_id, recorded_on, risk_score, rainfall)
SELECT l.id,
       (CURRENT_DATE - (6 - d))::date,
       LEAST(0.98, GREATEST(0.05, ROUND((l.risk_score - 0.18 + (d * 0.03) + ((random() - 0.5) * 0.05))::numeric, 2))),
       ROUND((l.rainfall_24h * (0.55 + d * 0.075) + (random() * 8))::numeric, 1)
FROM public.risk_locations l CROSS JOIN generate_series(0, 6) AS d;

INSERT INTO public.alerts (location_id, location_name, title, message, severity, risk_score, predicted_in, status, created_at) VALUES
('11111111-1111-4111-8111-000000000006','Sivasagar','Critical risk detected near Sivasagar','Continuous heavy rainfall with saturated soil. Immediate evacuation advisory for slope-adjacent settlements.','critical',0.82,'2 hours','active', now() - interval '10 minutes'),
('11111111-1111-4111-8111-000000000001','Dima Hasao','High risk in Dima Hasao','Rainfall 120mm in 24h, soil moisture rising. Restrict movement on NH-27 hill stretch.','high',0.78,'6 hours','active', now() - interval '15 minutes'),
('11111111-1111-4111-8111-000000000003','Maibong','High risk in Maibong','Slope instability detected along railway embankment.','high',0.73,'8 hours','active', now() - interval '45 minutes'),
('11111111-1111-4111-8111-000000000005','Karbi Anglong','Moderate risk in Karbi Anglong','Soil moisture at 26.5%. Monitor over next 12 hours.','moderate',0.58,'12 hours','acknowledged', now() - interval '2 hours'),
('11111111-1111-4111-8111-000000000011','Aizawl Hills','High risk in Aizawl Hills','Steep slope with 118mm rainfall; historical landslide zone.','high',0.71,'10 hours','active', now() - interval '3 hours'),
('11111111-1111-4111-8111-000000000004','Umrangso','Rainfall alert - 68 mm','Region: Umrangso | Source: IMD rainfall radar.','moderate',0.41,'24 hours','resolved', now() - interval '1 day'),
('11111111-1111-4111-8111-000000000002','Haflong','High risk in Haflong','Road cut slope showing tension cracks after 104mm rainfall.','high',0.67,'9 hours','active', now() - interval '5 hours'),
('11111111-1111-4111-8111-000000000009','Diphu','Low risk advisory - Diphu','Conditions stable. Routine monitoring continues.','low',0.36,'-','resolved', now() - interval '2 days');

INSERT INTO public.predictions (location_id, location_name, model, prediction_window, predicted_risk, probability, confidence) VALUES
('11111111-1111-4111-8111-000000000001','Dima Hasao','LSTM + Random Forest','7d','high',0.82,91.4),
('11111111-1111-4111-8111-000000000002','Haflong','LSTM + Random Forest','7d','moderate',0.67,88.2),
('11111111-1111-4111-8111-000000000003','Maibong','LSTM + Random Forest','7d','high',0.73,89.6),
('11111111-1111-4111-8111-000000000004','Umrangso','LSTM + Random Forest','7d','low',0.41,84.1),
('11111111-1111-4111-8111-000000000005','Karbi Anglong','LSTM + Random Forest','7d','moderate',0.58,86.7);

INSERT INTO public.field_reports (location_id, location_name, report_type, severity, description, status, reporter_name, created_at) VALUES
('11111111-1111-4111-8111-000000000001','Dima Hasao','Ground Crack','high','Slope crack observed 40m along the hill road shoulder near village approach.','verified','R. Terang', now() - interval '4 hours'),
('11111111-1111-4111-8111-000000000005','Karbi Anglong','Road Blockage','critical','Road damage with debris blocking one lane after overnight rain.','in_review','B. Rongphar', now() - interval '9 hours'),
('11111111-1111-4111-8111-000000000007','Jatinga','Waterlogging','moderate','Water seepage from hill face onto the settlement path.','pending','L. Thaosen', now() - interval '1 day'),
('11111111-1111-4111-8111-000000000008','Cachar','Landslide','high','Land movement of about 15m width reported on the slope above the highway.','verified','S. Dutta', now() - interval '2 days');

INSERT INTO public.data_sources (name, provider, category, status, latency_ms, refresh_interval, description) VALUES
('Weather Data','India Meteorological Department','weather','connected',110,'15 min','Temperature, humidity, wind and forecast feeds for NE India.'),
('Rainfall Radar','IMD Doppler Radar (Guwahati)','rainfall','connected',180,'10 min','Real-time rainfall intensity and accumulation grids.'),
('Soil Moisture Sensors','State IoT Sensor Grid','soil','connected',95,'5 min','142 in-situ sensors across Assam hill districts.'),
('Satellite Feeds','ISRO Bhuvan / Sentinel-2','satellite','degraded',640,'6 hours','Optical imagery for slope and land cover change detection.'),
('Terrain DEM','Cartosat-1 DEM 30m','terrain','connected',70,'Static','Elevation, slope and aspect derivatives.'),
('Historical Data','GSI Landslide Inventory','historical','connected',60,'Monthly','Historical landslide occurrence records since 1998.');