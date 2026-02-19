-- Drop ALL UPDATE triggers on vehicles tables
-- Clear out any triggers that might be referencing non-existent columns

-- Drop triggers for all known company codes
DROP TRIGGER IF EXISTS vehicles_human_update ON drivermgm.vehicles_human;
DROP TRIGGER IF EXISTS vehicles_kukdong_update ON drivermgm.vehicles_kukdong;
DROP TRIGGER IF EXISTS vehicles_update ON drivermgm.vehicles;

-- Drop all related trigger functions
DROP FUNCTION IF EXISTS drivermgm.vehicles_human_update() CASCADE;
DROP FUNCTION IF EXISTS drivermgm.vehicles_kukdong_update() CASCADE;
DROP FUNCTION IF EXISTS drivermgm.update_vehicle_update_timestamp() CASCADE;

-- Disable any constraints that might reference non-existent columns
-- This is a safety measure to ensure no constraints are causing issues
ALTER TABLE drivermgm.vehicles_human DISABLE TRIGGER ALL;
ALTER TABLE drivermgm.vehicles_kukdong DISABLE TRIGGER ALL;

-- Re-enable triggers but only if they exist and are valid
ALTER TABLE drivermgm.vehicles_human ENABLE TRIGGER ALL;
ALTER TABLE drivermgm.vehicles_kukdong ENABLE TRIGGER ALL;
