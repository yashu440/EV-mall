-- GridWise: Update to Indian Locale (INR Pricing)
-- Run this in the Supabase SQL Editor to update existing data

-- Update parking zone pricing to INR (₹/kWh)
UPDATE parking_zones SET price_per_kwh = 37.50 WHERE zone_code = 'A';
UPDATE parking_zones SET price_per_kwh = 29.00 WHERE zone_code = 'B';
UPDATE parking_zones SET price_per_kwh = 23.00 WHERE zone_code = 'C';
UPDATE parking_zones SET price_per_kwh = 46.00 WHERE zone_code = 'D';

-- Update mall name to Indian mall
UPDATE system_settings SET value = '"Phoenix Marketcity, Mumbai"' WHERE key = 'mall_name';
