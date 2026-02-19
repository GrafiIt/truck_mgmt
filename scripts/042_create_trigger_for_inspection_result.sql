-- 정기점검 결과를 vehicles 테이블에 반영하는 트리거
-- inspection_history_human에 INSERT될 때, 해당 vehicle의 inspection_result를 업데이트

-- human 회사용 트리거
CREATE OR REPLACE FUNCTION drivermgm.update_vehicles_inspection_result_human()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE drivermgm.vehicles_human
  SET 
    inspection_result = NEW.inspection_result,
    inspection_name = NEW.inspection_name,
    inspection_notes = NEW.inspection_notes,
    last_inspection_date = NEW.inspection_date,
    updated_at = NOW()
  WHERE id = NEW.vehicle_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vehicles_inspection_result_human_trigger ON drivermgm.inspection_history_human;

CREATE TRIGGER update_vehicles_inspection_result_human_trigger
AFTER INSERT ON drivermgm.inspection_history_human
FOR EACH ROW
EXECUTE FUNCTION drivermgm.update_vehicles_inspection_result_human();

-- kukdong 회사용 트리거
CREATE OR REPLACE FUNCTION drivermgm.update_vehicles_inspection_result_kukdong()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE drivermgm.vehicles_kukdong
  SET 
    inspection_result = NEW.inspection_result,
    inspection_name = NEW.inspection_name,
    inspection_notes = NEW.inspection_notes,
    last_inspection_date = NEW.inspection_date,
    updated_at = NOW()
  WHERE id = NEW.vehicle_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vehicles_inspection_result_kukdong_trigger ON drivermgm.inspection_history_kukdong;

CREATE TRIGGER update_vehicles_inspection_result_kukdong_trigger
AFTER INSERT ON drivermgm.inspection_history_kukdong
FOR EACH ROW
EXECUTE FUNCTION drivermgm.update_vehicles_inspection_result_kukdong();
