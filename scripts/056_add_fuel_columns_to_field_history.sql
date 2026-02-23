-- Add fuel_amount and fuel_cost columns to vehicle_field_history table
ALTER TABLE vehicle_field_history
ADD COLUMN IF NOT EXISTS fuel_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS fuel_cost INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN vehicle_field_history.fuel_amount IS '주유량 (리터)';
COMMENT ON COLUMN vehicle_field_history.fuel_cost IS '주유비 (원)';

-- Migrate existing refueling records from text_value to fuel_amount
UPDATE vehicle_field_history
SET fuel_amount = CASE 
  WHEN text_value ~ '^[0-9]+\.?[0-9]*$' THEN text_value::DECIMAL(10, 2)
  ELSE NULL
END
WHERE field_name = 'refueling' AND text_value IS NOT NULL AND fuel_amount IS NULL;

-- Copy cost to fuel_cost for refueling records
UPDATE vehicle_field_history
SET fuel_cost = cost
WHERE field_name = 'refueling' AND cost IS NOT NULL AND fuel_cost IS NULL;
