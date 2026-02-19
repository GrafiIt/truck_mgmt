-- Add vehicle_type column to company-specific vehicle tables
ALTER TABLE drivermgm.vehicles_kukdong 
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20);

-- Also add to vehicles_human if it exists
ALTER TABLE drivermgm.vehicles_human 
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20);

-- Add comments to describe the columns
COMMENT ON COLUMN drivermgm.vehicles_kukdong.vehicle_type IS '차량 종류 (탱크로리, 25톤, 14톤, 11톤, 8톤, 5톤, 3.5톤, 2.5톤, 1.2톤, 1톤)';
COMMENT ON COLUMN drivermgm.vehicles_human.vehicle_type IS '차량 종류 (탱크로리, 25톤, 14톤, 11톤, 8톤, 5톤, 3.5톤, 2.5톤, 1.2톤, 1톤)';
