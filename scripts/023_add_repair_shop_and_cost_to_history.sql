-- Add repair_shop and cost columns to vehicle_field_history table
ALTER TABLE vehicle_field_history
ADD COLUMN IF NOT EXISTS repair_shop VARCHAR(255),
ADD COLUMN IF NOT EXISTS cost INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN vehicle_field_history.repair_shop IS '수리업체';
COMMENT ON COLUMN vehicle_field_history.cost IS '금액 (원)';
