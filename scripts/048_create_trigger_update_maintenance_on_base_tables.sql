-- Create trigger to update vehicles table when maintenance records are added
-- This trigger updates the "최종 저장값" fields in vehicles table

CREATE OR REPLACE FUNCTION drivermgm.update_vehicle_maintenance_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vehicles table based on field_name
  -- Only update for maintenance fields (not refueling, monthly_mileage, etc.)
  
  IF NEW.field_name IN ('grease', 'brake_fluid', 'battery', 'wiper', 'wheel_alignment', 'air_filter', 'air_dryer') THEN
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
DROP TRIGGER IF EXISTS update_maintenance_fields_trigger ON drivermgm.vehicle_field_history_human;
CREATE TRIGGER update_maintenance_fields_trigger
AFTER INSERT ON drivermgm.vehicle_field_history_human
FOR EACH ROW
EXECUTE FUNCTION drivermgm.update_vehicle_maintenance_fields();

DROP TRIGGER IF EXISTS update_maintenance_fields_trigger ON drivermgm.vehicle_field_history_kukdong;
CREATE TRIGGER update_maintenance_fields_trigger
AFTER INSERT ON drivermgm.vehicle_field_history_kukdong
FOR EACH ROW
EXECUTE FUNCTION drivermgm.update_vehicle_maintenance_fields();

-- Note: Add more triggers as new companies are added
