-- 054_rollback_to_original_trigger.sql
-- 기존 트리거 로직으로 복원 (스크립트 052 롤백)

-- 원본 트리거 함수로 복원 (051 스크립트의 로직)
CREATE OR REPLACE FUNCTION drivermgm.sync_refueling_to_vehicles()
RETURNS TRIGGER AS $$
DECLARE
  company_suffix TEXT;
  vehicles_table_name TEXT;
BEGIN
  -- 테이블 이름에서 회사 코드 추출
  company_suffix := CASE 
    WHEN TG_TABLE_NAME LIKE '%_human' THEN 'human'
    WHEN TG_TABLE_NAME LIKE '%_kukdong' THEN 'kukdong'
    ELSE NULL
  END;

  IF company_suffix IS NULL THEN
    RETURN NEW;
  END IF;

  vehicles_table_name := 'drivermgm.vehicles_' || company_suffix;

  -- total_mileage 업데이트 (무조건 업데이트)
  EXECUTE format(
    'UPDATE %I SET total_mileage = $1, last_refuel_date = $2, last_refuel_mileage = $3 WHERE id = $4',
    vehicles_table_name
  ) USING NEW.mileage_value, NEW.date_value, NEW.mileage_value, NEW.vehicle_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 코멘트 복원
COMMENT ON FUNCTION drivermgm.sync_refueling_to_vehicles() IS '주유 이력을 vehicles 테이블에 자동 반영 (모든 회사 공통)';
