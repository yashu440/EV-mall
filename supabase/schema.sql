-- GridWise Database Schema for Supabase
-- Run these in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Parking Zones
CREATE TABLE IF NOT EXISTS parking_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  zone_code CHAR(1) UNIQUE NOT NULL,
  level TEXT NOT NULL,
  total_stations INTEGER NOT NULL DEFAULT 0,
  charger_type TEXT NOT NULL,
  max_capacity_kw DECIMAL NOT NULL,
  price_per_kwh DECIMAL(5,2) NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Charging Stations
CREATE TABLE IF NOT EXISTS charging_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_code TEXT UNIQUE NOT NULL,
  zone_id UUID REFERENCES parking_zones(id),
  status TEXT DEFAULT 'available', -- available, charging, offline, maintenance
  max_power_kw DECIMAL NOT NULL,
  current_power_kw DECIMAL DEFAULT 0,
  firmware_version TEXT,
  last_maintenance TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_plate TEXT UNIQUE NOT NULL,
  make_model TEXT NOT NULL,
  battery_capacity_kwh DECIMAL,
  max_charge_rate_kw DECIMAL,
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Charging Sessions
CREATE TABLE IF NOT EXISTS charging_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_code TEXT UNIQUE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  station_id UUID REFERENCES charging_stations(id),
  zone_id UUID REFERENCES parking_zones(id),
  status TEXT DEFAULT 'queued', -- queued, charging, completed, cancelled, error
  priority TEXT DEFAULT 'medium', -- low, medium, high, express
  start_charge_percent DECIMAL,
  target_charge_percent DECIMAL,
  current_charge_percent DECIMAL,
  energy_delivered_kwh DECIMAL DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  shopping_duration_minutes INTEGER,
  start_time TIMESTAMPTZ,
  estimated_end_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grid Metrics (time-series data)
CREATE TABLE IF NOT EXISTS grid_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  total_load_kw DECIMAL NOT NULL,
  total_capacity_kw DECIMAL NOT NULL,
  solar_generation_kw DECIMAL DEFAULT 0,
  active_sessions INTEGER DEFAULT 0,
  zone_a_load DECIMAL DEFAULT 0,
  zone_b_load DECIMAL DEFAULT 0,
  zone_c_load DECIMAL DEFAULT 0,
  zone_d_load DECIMAL DEFAULT 0
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- alert, success, info, warning
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  session_id UUID REFERENCES charging_sessions(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Insights Log
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- optimization, fairness, revenue, sustainability
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT DEFAULT 'medium', -- low, medium, high
  estimated_savings TEXT,
  is_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_status ON charging_sessions(status);
CREATE INDEX idx_sessions_zone ON charging_sessions(zone_id);
CREATE INDEX idx_sessions_created ON charging_sessions(created_at);
CREATE INDEX idx_stations_zone ON charging_stations(zone_id);
CREATE INDEX idx_stations_status ON charging_stations(status);
CREATE INDEX idx_grid_metrics_timestamp ON grid_metrics(timestamp);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Insert default parking zones
INSERT INTO parking_zones (name, zone_code, level, total_stations, charger_type, max_capacity_kw, price_per_kwh) VALUES
  ('Zone A – Premium', 'A', 'L1', 16, 'DC Fast (150kW)', 480, 37.50),
  ('Zone B – Standard', 'B', 'L1', 20, 'Level 2 (22kW)', 440, 29.00),
  ('Zone C – Economy', 'C', 'L2', 18, 'Level 2 (11kW)', 216, 23.00),
  ('Zone D – Express', 'D', 'L1', 10, 'DC Ultra-Fast (350kW)', 3500, 46.00);

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('mall_name', '"Phoenix Marketcity, Mumbai"', 'Name of the mall/facility'),
  ('operating_hours', '{"start": "06:00", "end": "23:00"}', 'Mall operating hours'),
  ('max_grid_load', '85', 'Maximum grid load percentage before throttling'),
  ('auto_scheduling', 'true', 'Enable AI auto-scheduling'),
  ('fairness_engine', 'true', 'Enable fairness distribution engine'),
  ('peak_hours', '{"start": "11:00", "end": "14:00"}', 'Peak shopping/charging hours'),
  ('peak_surcharge', '15', 'Peak hour surcharge percentage'),
  ('off_peak_discount', '10', 'Off-peak discount percentage');

-- Row Level Security
ALTER TABLE charging_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public read policy for demo
CREATE POLICY "Public read access" ON parking_zones FOR SELECT TO anon USING (true);
CREATE POLICY "Public read access" ON charging_stations FOR SELECT TO anon USING (true);
CREATE POLICY "Public read access" ON grid_metrics FOR SELECT TO anon USING (true);
CREATE POLICY "Public read access" ON system_settings FOR SELECT TO anon USING (true);
