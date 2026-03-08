-- GridWise v2: Add user profiles and update RLS
-- Run this in Supabase SQL Editor AFTER the base schema

-- User Profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_id to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Remove unique constraint on license_plate (allow same plate for different users)
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_license_plate_key;

-- Add charger_type to charging_stations if missing
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS charger_type TEXT;

-- Add user_id to charging_sessions
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- ============================================
-- ADMIN CHECK FUNCTION (SECURITY DEFINER bypasses RLS)
-- This prevents infinite recursion in policies
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Profiles: users see own, admins see all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (
  auth.uid() = id OR public.is_admin()
);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow profile insert on signup" ON profiles;
CREATE POLICY "Allow profile insert on signup" ON profiles FOR INSERT WITH CHECK (true);

-- Vehicles: users see own, admins see all, users can insert
DROP POLICY IF EXISTS "Users manage own vehicles" ON vehicles;
CREATE POLICY "Users manage own vehicles" ON vehicles FOR SELECT USING (
  user_id = auth.uid() OR public.is_admin()
);
DROP POLICY IF EXISTS "Users can insert vehicles" ON vehicles;
CREATE POLICY "Users can insert vehicles" ON vehicles FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE USING (
  user_id = auth.uid() OR public.is_admin()
);

-- Charging Sessions: users see own, admins see all
DROP POLICY IF EXISTS "Users view own sessions" ON charging_sessions;
CREATE POLICY "Users view own sessions" ON charging_sessions FOR SELECT USING (
  user_id = auth.uid() OR public.is_admin()
);
DROP POLICY IF EXISTS "Users can create sessions" ON charging_sessions;
CREATE POLICY "Users can create sessions" ON charging_sessions FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
DROP POLICY IF EXISTS "Admins can update sessions" ON charging_sessions;
CREATE POLICY "Users and admins update sessions" ON charging_sessions FOR UPDATE USING (
  user_id = auth.uid() OR public.is_admin()
);

-- Notifications: users see own, admins see all
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (
  user_id = auth.uid() OR user_id IS NULL OR public.is_admin()
);

-- Parking Zones: everyone can read, admins can modify
DROP POLICY IF EXISTS "Public read access" ON parking_zones;
DROP POLICY IF EXISTS "Anyone can read zones" ON parking_zones;
CREATE POLICY "Anyone can read zones" ON parking_zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage zones" ON parking_zones;
CREATE POLICY "Admins update zones" ON parking_zones FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admins insert zones" ON parking_zones;
CREATE POLICY "Admins insert zones" ON parking_zones FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins delete zones" ON parking_zones;
CREATE POLICY "Admins delete zones" ON parking_zones FOR DELETE USING (public.is_admin());

-- Charging Stations: everyone can read, authenticated users can update status (for booking)
DROP POLICY IF EXISTS "Public read access" ON charging_stations;
DROP POLICY IF EXISTS "Anyone can read stations" ON charging_stations;
CREATE POLICY "Anyone can read stations" ON charging_stations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage stations" ON charging_stations;
DROP POLICY IF EXISTS "Authenticated update stations" ON charging_stations;
CREATE POLICY "Authenticated update stations" ON charging_stations FOR UPDATE USING (
  auth.uid() IS NOT NULL
);
DROP POLICY IF EXISTS "Admins insert stations" ON charging_stations;
CREATE POLICY "Admins insert stations" ON charging_stations FOR INSERT WITH CHECK (public.is_admin());

-- Grid Metrics: everyone can read
DROP POLICY IF EXISTS "Public read access" ON grid_metrics;
DROP POLICY IF EXISTS "Anyone can read metrics" ON grid_metrics;
CREATE POLICY "Anyone can read metrics" ON grid_metrics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins insert metrics" ON grid_metrics;
CREATE POLICY "Admins insert metrics" ON grid_metrics FOR INSERT WITH CHECK (public.is_admin());

-- System Settings: everyone can read, admins can modify
DROP POLICY IF EXISTS "Public read access" ON system_settings;
DROP POLICY IF EXISTS "Anyone can read settings" ON system_settings;
CREATE POLICY "Anyone can read settings" ON system_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage settings" ON system_settings;
CREATE POLICY "Admins manage settings" ON system_settings FOR UPDATE USING (public.is_admin());

-- AI Insights: everyone can read
DROP POLICY IF EXISTS "Anyone can read insights" ON ai_insights;
CREATE POLICY "Anyone can read insights" ON ai_insights FOR SELECT USING (true);

-- ============================================
-- CREATE FIRST ADMIN
-- ============================================
-- After signing up with admin@gridwise.in / GridWise@2026, run:
-- UPDATE profiles SET role = 'admin' WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'admin@gridwise.in'
-- );
