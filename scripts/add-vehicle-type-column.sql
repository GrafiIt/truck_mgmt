-- Add vehicle_type column to vehicles table in drivermgm schema
ALTER TABLE drivermgm.vehicles 
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20);

-- Add comment to describe the column
COMMENT ON COLUMN drivermgm.vehicles.vehicle_type IS '차량 종류 (탱크로리, 25톤, 14톤, 11톤, 8톤, 5톤, 3.5톤, 2.5톤, 1.2톤, 1톤)';
