-- 055_fix_trigger_correctly.sql
-- 트리거를 정확하게 복원 (스크립트 051의 원본 로직)

-- 주유 기록 자동 반영 트리거 함수 (원본 복원)
CREATE OR REPLACE FUNCTION drivermgm.sync_refueling_to_vehicles()
RETURNS TRIGGER AS $$
DECLARE
  company_suffix TEXT;
  vehicles_table_name TEXT;
BEGIN
  -- 테이블 이름에서 회사 코드 추출
  -- 예: vehicle_field_history_human -> human
  company_suffix := regexp_replace(TG_TABLE_NAME, '^vehicle_field_history_', '');
  vehicles_table_name := 'drivermgm.vehicles_' || company_suffix;
  
  -- 주유 기록인 경우 total_mileage와 last_refuel_date, last_refuel_mileage 업데이트
  IF NEW.field_name = 'refueling' AND NEW.mileage_value IS NOT NULL THEN
    EXECUTE format(
      'UPDATE %s SET 
        total_mileage = $1, 
        last_refuel_date = $2,
        last_refuel_mileage = $3,
        updated_at = NOW() 
      WHERE id = $4',
      vehicles_table_name
    ) USING NEW.mileage_value, NEW.date_value, NEW.mileage_value, NEW.vehicle_id;
    
    RAISE NOTICE 'Updated refueling data for vehicle_id % in %: total_mileage=%', NEW.vehicle_id, vehicles_table_name, NEW.mileage_value;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS sync_refueling_to_vehicles_human ON drivermgm.vehicle_field_history_human;
DROP TRIGGER IF EXISTS sync_refueling_to_vehicles_kukdong ON drivermgm.vehicle_field_history_kukdong;

-- human 회사 주유 트리거
CREATE TRIGGER sync_refueling_to_vehicles_human
AFTER INSERT ON drivermgm.vehicle_field_history_human
FOR EACH ROW
WHEN (NEW.field_name = 'refueling')
EXECUTE FUNCTION drivermgm.sync_refueling_to_vehicles();

-- kukdong 회사 주유 트리거
CREATE TRIGGER sync_refueling_to_vehicles_kukdong
AFTER INSERT ON drivermgm.vehicle_field_history_kukdong
FOR EACH ROW
WHEN (NEW.field_name = 'refueling')
EXECUTE FUNCTION drivermgm.sync_refueling_to_vehicles();

-- 코멘트 추가
COMMENT ON FUNCTION drivermgm.sync_refueling_to_vehicles() IS '주유 이력을 vehicles 테이블에 자동 반영 (모든 회사 공통) - 원본 복원';
