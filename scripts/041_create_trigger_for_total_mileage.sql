-- 모든 회사별 vehicle_field_history 테이블에 트리거 생성
-- 주유 기록이 저장될 때 vehicles 테이블의 total_mileage를 자동 업데이트

-- HUMAN 회사
CREATE OR REPLACE FUNCTION drivermgm.update_total_mileage_human()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.field_name = 'refueling' AND NEW.mileage_value IS NOT NULL THEN
    UPDATE drivermgm.vehicles_human
    SET total_mileage = NEW.mileage_value, updated_at = NOW()
    WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_total_mileage_on_refueling_human ON drivermgm.vehicle_field_history_human;

CREATE TRIGGER update_total_mileage_on_refueling_human
AFTER INSERT ON drivermgm.vehicle_field_history_human
FOR EACH ROW
EXECUTE FUNCTION drivermgm.update_total_mileage_human();

-- KUKDONG 회사
CREATE OR REPLACE FUNCTION drivermgm.update_total_mileage_kukdong()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.field_name = 'refueling' AND NEW.mileage_value IS NOT NULL THEN
    UPDATE drivermgm.vehicles_kukdong
    SET total_mileage = NEW.mileage_value, updated_at = NOW()
    WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_total_mileage_on_refueling_kukdong ON drivermgm.vehicle_field_history_kukdong;

CREATE TRIGGER update_total_mileage_on_refueling_kukdong
AFTER INSERT ON drivermgm.vehicle_field_history_kukdong
FOR EACH ROW
EXECUTE FUNCTION drivermgm.update_total_mileage_kukdong();
