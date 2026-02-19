-- Disable all problematic UPDATE triggers on vehicles tables
-- These triggers are trying to reference non-existent columns

-- Drop the trigger for vehicles_human
DROP TRIGGER IF EXISTS vehicles_human_update ON drivermgm.vehicles_human;
DROP TRIGGER IF EXISTS vehicles_kukdong_update ON drivermgm.vehicles_kukdong;

-- Drop the trigger functions
DROP FUNCTION IF EXISTS drivermgm.vehicles_human_update();
DROP FUNCTION IF EXISTS drivermgm.vehicles_kukdong_update();
