-- Fix RLS policies for notification_thresholds table to allow updates

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anon to read notification_thresholds" ON drivermgm.notification_thresholds;
DROP POLICY IF EXISTS "Allow anon to update notification_thresholds" ON drivermgm.notification_thresholds;

-- Create policies with proper permissions
CREATE POLICY "Allow anon to read notification_thresholds" 
  ON drivermgm.notification_thresholds
  FOR SELECT 
  TO anon 
  USING (true);

CREATE POLICY "Allow anon to update notification_thresholds" 
  ON drivermgm.notification_thresholds
  FOR UPDATE 
  TO anon 
  USING (true)
  WITH CHECK (true);

-- Also grant necessary table permissions
GRANT SELECT, UPDATE ON drivermgm.notification_thresholds TO anon;
GRANT USAGE ON SCHEMA drivermgm TO anon;
