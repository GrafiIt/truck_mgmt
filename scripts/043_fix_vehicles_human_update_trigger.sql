-- 043_fix_vehicles_human_update_trigger.sql
-- vehicles_human_update 트리거를 수정하여 실제 존재하는 컬럼만 업데이트

CREATE OR REPLACE FUNCTION public.vehicles_human_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE drivermgm.vehicles_human SET
    vehicle_number = NEW.vehicle_number,
    transporter = NEW.transporter,
    driver_name = NEW.driver_name,
    manufacturer = NEW.manufacturer,
    release_date = NEW.release_date,
    total_mileage = NEW.total_mileage,
    last_inspection_date = NEW.last_inspection_date,
    inspection_result = NEW.inspection_result,
    inspection_name = NEW.inspection_name,
    inspection_notes = NEW.inspection_notes,
    last_maintenance_date = NEW.last_maintenance_date,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
