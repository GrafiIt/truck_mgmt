-- Update trigger to handle all maintenance fields (except refueling, inspection, monthly_mileage, others)
-- This trigger updates the "최종 저장값" fields in vehicles table for all maintenance items

DROP TRIGGER IF EXISTS update_maintenance_fields_trigger ON drivermgm.vehicle_field_history_human;
DROP TRIGGER IF EXISTS update_maintenance_fields_trigger ON drivermgm.vehicle_field_history_kukdong;
DROP FUNCTION IF EXISTS drivermgm.update_vehicle_maintenance_fields();

CREATE OR REPLACE FUNCTION drivermgm.update_vehicle_maintenance_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vehicles table based on field_name
  -- Exclude: refueling (separate trigger), inspection (separate trigger), monthly_mileage, others
  
  IF NEW.field_name NOT IN ('refueling', 'inspection', 'monthly_mileage', 'others', 'fuel_efficiency') THEN
    -- Build dynamic update based on field name
    EXECUTE format(
      'UPDATE drivermgm.vehicles_%s SET %I = $1, %I = $2, updated_at = NOW() WHERE id = $3',
      split_part(TG_TABLE_NAME, '_', 4), -- Extract company code (human, kukdong, etc.)
      NEW.field_name || '_date',
      NEW.field_name || '_mileage'
    ) USING NEW.date_value, NEW.mileage_value, NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on all company-specific vehicle_field_history tables
CREATE TRIGGER update_maintenance_fields_trigger
AFTER INSERT ON drivermgm.vehicle_field_history_human
FOR EACH ROW
EXECUTE FUNCTION drivermgm.update_vehicle_maintenance_fields();

CREATE TRIGGER update_maintenance_fields_trigger
AFTER INSERT ON drivermgm.vehicle_field_history_kukdong
FOR EACH ROW
EXECUTE FUNCTION drivermgm.update_vehicle_maintenance_fields();
