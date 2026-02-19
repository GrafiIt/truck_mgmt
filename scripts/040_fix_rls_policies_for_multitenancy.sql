-- Fix RLS policies for all company-specific tables in drivermgm schema
-- These tables were created by the multi-tenancy setup but RLS is enabled with no policies
-- This effectively blocks all access. We need to add service_role bypass or disable RLS.

-- Disable RLS on all company-specific tables since we're using service_role (which bypasses RLS anyway)
ALTER TABLE drivermgm.vehicles_human DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivermgm.vehicles_kukdong DISABLE ROW LEVEL SECURITY;

ALTER TABLE drivermgm.vehicle_users_human DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivermgm.vehicle_users_kukdong DISABLE ROW LEVEL SECURITY;

ALTER TABLE drivermgm.vehicle_field_history_human DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivermgm.vehicle_field_history_kukdong DISABLE ROW LEVEL SECURITY;

ALTER TABLE drivermgm.inspection_history_human DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivermgm.inspection_history_kukdong DISABLE ROW LEVEL SECURITY;

ALTER TABLE drivermgm.refueling_history_human DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivermgm.refueling_history_kukdong DISABLE ROW LEVEL SECURITY;

ALTER TABLE drivermgm.maintenance_records_human DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivermgm.maintenance_records_kukdong DISABLE ROW LEVEL SECURITY;
