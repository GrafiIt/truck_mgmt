-- 052_fix_total_mileage_update_logic.sql
-- 주유 기록 트리거를 수정하여 total_mileage가 현재값보다 클 때만 업데이트하도록 변경

-- 기존 주유 트리거 함수를 대체하는 새로운 함수
CREATE OR REPLACE FUNCTION drivermgm.sync_refueling_to_vehicles()
RETURNS TRIGGER AS $$
DECLARE
  company_suffix TEXT;
  vehicles_table_name TEXT;
  current_total_mileage INTEGER;
BEGIN
  -- 테이블 이름에서 회사 코드 추출
  company_suffix := regexp_replace(TG_TABLE_NAME, '^vehicle_field_history_', '');
  vehicles_table_name := 'drivermgm.vehicles_' || company_suffix;
  
  -- 주유 기록인 경우에만 처리
  IF NEW.field_name = 'refueling' AND NEW.mileage_value IS NOT NULL THEN
    -- 현재 total_mileage 조회
    EXECUTE format('SELECT total_mileage FROM %s WHERE id = $1', vehicles_table_name)
    INTO current_total_mileage
    USING NEW.vehicle_id;
    
    -- 새로운 주행거리가 현재 총주행거리보다 크거나 같은 경우에만 업데이트
    -- (같은 경우도 포함하여 주유 날짜와 주행거리는 항상 업데이트)
    IF NEW.mileage_value >= COALESCE(current_total_mileage, 0) THEN
      EXECUTE format(
        'UPDATE %s SET 
          total_mileage = $1, 
          last_refuel_date = $2,
          last_refuel_mileage = $3,
          updated_at = NOW() 
        WHERE id = $4',
        vehicles_table_name
      ) USING NEW.mileage_value, NEW.date_value, NEW.mileage_value, NEW.vehicle_id;
      
      RAISE NOTICE 'Updated refueling data for vehicle_id % in % (old: %, new: %)', 
        NEW.vehicle_id, vehicles_table_name, current_total_mileage, NEW.mileage_value;
    ELSE
      -- 주행거리가 현재값보다 작으면 업데이트하지 않고 경고 로그만 남김
      RAISE WARNING 'Refueling mileage (%) is less than current total_mileage (%) for vehicle_id % in %. Skipping total_mileage update.',
        NEW.mileage_value, current_total_mileage, NEW.vehicle_id, vehicles_table_name;
      
      -- 주유 날짜와 주행거리는 참고용으로 업데이트 (total_mileage는 업데이트하지 않음)
      EXECUTE format(
        'UPDATE %s SET 
          last_refuel_date = $1,
          last_refuel_mileage = $2,
          updated_at = NOW() 
        WHERE id = $3',
        vehicles_table_name
      ) USING NEW.date_value, NEW.mileage_value, NEW.vehicle_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 코멘트 업데이트
COMMENT ON FUNCTION drivermgm.sync_refueling_to_vehicles() IS '주유 이력을 vehicles 테이블에 자동 반영 (총주행거리가 증가할 때만 업데이트)';

-- 트리거는 이미 051 스크립트에서 생성되었으므로 재생성할 필요 없음
-- 함수만 대체되면 기존 트리거가 새 함수를 사용함
