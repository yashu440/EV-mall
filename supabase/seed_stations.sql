-- Seed Charging Stations for all zones
-- Run this AFTER schema.sql and schema_v2.sql

-- Function to insert stations for each zone
DO $$
DECLARE
  zone_a_id UUID;
  zone_b_id UUID;
  zone_c_id UUID;
  zone_d_id UUID;
  i INTEGER;
BEGIN
  -- Get zone IDs
  SELECT id INTO zone_a_id FROM parking_zones WHERE zone_code = 'A';
  SELECT id INTO zone_b_id FROM parking_zones WHERE zone_code = 'B';
  SELECT id INTO zone_c_id FROM parking_zones WHERE zone_code = 'C';
  SELECT id INTO zone_d_id FROM parking_zones WHERE zone_code = 'D';

  -- Zone A: 16 DC Fast stations (150kW)
  FOR i IN 1..16 LOOP
    INSERT INTO charging_stations (station_code, zone_id, charger_type, max_power_kw, status)
    VALUES ('A-' || LPAD(i::text, 2, '0'), zone_a_id, 'DC Fast', 150, 
      CASE WHEN i <= 14 THEN 'available' ELSE 'maintenance' END
    )
    ON CONFLICT (station_code) DO NOTHING;
  END LOOP;

  -- Zone B: 20 Level 2 stations (22kW)
  FOR i IN 1..20 LOOP
    INSERT INTO charging_stations (station_code, zone_id, charger_type, max_power_kw, status)
    VALUES ('B-' || LPAD(i::text, 2, '0'), zone_b_id, 'Level 2', 22,
      CASE WHEN i <= 15 THEN 'available' ELSE 'maintenance' END
    )
    ON CONFLICT (station_code) DO NOTHING;
  END LOOP;

  -- Zone C: 18 Level 2 stations (11kW)
  FOR i IN 1..18 LOOP
    INSERT INTO charging_stations (station_code, zone_id, charger_type, max_power_kw, status)
    VALUES ('C-' || LPAD(i::text, 2, '0'), zone_c_id, 'Level 2', 11,
      CASE WHEN i <= 10 THEN 'available' ELSE 'maintenance' END
    )
    ON CONFLICT (station_code) DO NOTHING;
  END LOOP;

  -- Zone D: 10 Ultra-Fast stations (350kW)
  FOR i IN 1..10 LOOP
    INSERT INTO charging_stations (station_code, zone_id, charger_type, max_power_kw, status)
    VALUES ('D-' || LPAD(i::text, 2, '0'), zone_d_id, 'DC Ultra-Fast', 350,
      CASE WHEN i <= 8 THEN 'available' ELSE 'maintenance' END
    )
    ON CONFLICT (station_code) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- CREATE ADMIN USER
-- ============================================
-- Step 1: Sign up at /login with these credentials:
--   Email: admin@gridwise.in
--   Password: GridWise@2026
--   Name: GridWise Admin
--
-- Step 2: After signup, run this query to make the account admin:
-- UPDATE profiles SET role = 'admin' WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'admin@gridwise.in'
-- );
