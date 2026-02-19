-- 모든 정비 이력을 vehicles 테이블에 자동 반영하는 통합 트리거
-- 모든 회사에 동일하게 적용되는 범용 트리거

-- 기존 트리거와 함수 삭제
DROP TRIGGER IF EXISTS update_maintenance_fields_trigger ON drivermgm.vehicle_field_history_human;
DROP TRIGGER IF EXISTS update_maintenance_fields_trigger ON drivermgm.vehicle_field_history_kukdong;
DROP TRIGGER IF EXISTS update_maintenance_fields_human ON drivermgm.vehicle_field_history_human;
DROP TRIGGER IF EXISTS update_maintenance_fields_kukdong ON drivermgm.vehicle_field_history_kukdong;
DROP FUNCTION IF EXISTS drivermgm.update_vehicle_maintenance_fields();
DROP FUNCTION IF EXISTS update_vehicle_maintenance_fields();

-- 새로운 통합 트리거 함수 생성
CREATE OR REPLACE FUNCTION drivermgm.sync_vehicle_maintenance_fields()
RETURNS TRIGGER AS $$
DECLARE
  company_suffix TEXT;
  vehicles_table_name TEXT;
  field_date_column TEXT;
  field_mileage_column TEXT;
BEGIN
  -- 테이블 이름에서 회사 코드 추출 
  -- 예: vehicle_field_history_human -> human
  -- 예: vehicle_field_history_kukdong -> kukdong
  company_suffix := regexp_replace(TG_TABLE_NAME, '^vehicle_field_history_', '');
  
  -- vehicles 테이블 이름 구성
  vehicles_table_name := 'drivermgm.vehicles_' || company_suffix;
  
  -- 제외할 필드: refueling, inspection, monthly_mileage, others, fuel_efficiency
  IF NEW.field_name NOT IN ('refueling', 'inspection', 'monthly_mileage', 'others', 'fuel_efficiency') THEN
    -- 필드별 컬럼 이름 생성
    field_date_column := NEW.field_name || '_date';
    field_mileage_column := NEW.field_name || '_mileage';
    
    -- vehicles 테이블의 해당 필드 업데이트 (동적 SQL 사용)
    EXECUTE format(
      'UPDATE %s SET %I = $1, %I = $2, updated_at = NOW() WHERE id = $3',
      vehicles_table_name,
      field_date_column,
      field_mileage_column
    ) USING NEW.date_value, NEW.mileage_value, NEW.vehicle_id;
    
    RAISE NOTICE 'Updated % for vehicle_id % in %', NEW.field_name, NEW.vehicle_id, vehicles_table_name;
  ELSIF NEW.field_name = 'others' THEN
    -- 기타 항목의 경우 한줄요약만 업데이트
    EXECUTE format(
      'UPDATE %s SET others_summary = $1, others_date = $2, others_mileage = $3, updated_at = NOW() WHERE id = $4',
      vehicles_table_name
    ) USING NEW.text_value, NEW.date_value, NEW.mileage_value, NEW.vehicle_id;
    
    RAISE NOTICE 'Updated others summary for vehicle_id % in %', NEW.vehicle_id, vehicles_table_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- human 회사 트리거 생성
CREATE TRIGGER sync_maintenance_to_vehicles_human
AFTER INSERT ON drivermgm.vehicle_field_history_human
FOR EACH ROW
EXECUTE FUNCTION drivermgm.sync_vehicle_maintenance_fields();

-- kukdong 회사 트리거 생성
CREATE TRIGGER sync_maintenance_to_vehicles_kukdong
AFTER INSERT ON drivermgm.vehicle_field_history_kukdong
FOR EACH ROW
EXECUTE FUNCTION drivermgm.sync_vehicle_maintenance_fields();

-- 주유 기록 자동 반영 트리거 (total_mileage 업데이트)
CREATE OR REPLACE FUNCTION drivermgm.sync_refueling_to_vehicles()
RETURNS TRIGGER AS $$
DECLARE
  company_suffix TEXT;
  vehicles_table_name TEXT;
BEGIN
  -- 테이블 이름에서 회사 코드 추출
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
    
    RAISE NOTICE 'Updated refueling data for vehicle_id % in %', NEW.vehicle_id, vehicles_table_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- 월간주행거리 자동 반영 트리거 (previous_month_mileage 업데이트)
CREATE OR REPLACE FUNCTION drivermgm.sync_monthly_mileage_to_vehicles()
RETURNS TRIGGER AS $$
DECLARE
  company_suffix TEXT;
  vehicles_table_name TEXT;
BEGIN
  -- 테이블 이름에서 회사 코드 추출
  company_suffix := regexp_replace(TG_TABLE_NAME, '^vehicle_field_history_', '');
  vehicles_table_name := 'drivermgm.vehicles_' || company_suffix;
  
  -- 월간주행거리 기록인 경우 previous_month_mileage 업데이트
  IF NEW.field_name = 'monthly_mileage' AND NEW.mileage_value IS NOT NULL THEN
    EXECUTE format(
      'UPDATE %s SET 
        previous_month_mileage = $1,
        last_monthly_mileage = $2,
        last_monthly_mileage_date = $3,
        updated_at = NOW() 
      WHERE id = $4',
      vehicles_table_name
    ) USING NEW.mileage_value, NEW.mileage_value, NEW.date_value, NEW.vehicle_id;
    
    RAISE NOTICE 'Updated monthly mileage for vehicle_id % in %', NEW.vehicle_id, vehicles_table_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- human 회사 월간주행거리 트리거
CREATE TRIGGER sync_monthly_mileage_to_vehicles_human
AFTER INSERT ON drivermgm.vehicle_field_history_human
FOR EACH ROW
WHEN (NEW.field_name = 'monthly_mileage')
EXECUTE FUNCTION drivermgm.sync_monthly_mileage_to_vehicles();

-- kukdong 회사 월간주행거리 트리거
CREATE TRIGGER sync_monthly_mileage_to_vehicles_kukdong
AFTER INSERT ON drivermgm.vehicle_field_history_kukdong
FOR EACH ROW
WHEN (NEW.field_name = 'monthly_mileage')
EXECUTE FUNCTION drivermgm.sync_monthly_mileage_to_vehicles();

-- 정기점검 자동 반영 트리거
CREATE OR REPLACE FUNCTION drivermgm.sync_inspection_to_vehicles()
RETURNS TRIGGER AS $$
DECLARE
  company_suffix TEXT;
  vehicles_table_name TEXT;
BEGIN
  -- 테이블 이름에서 회사 코드 추출
  company_suffix := regexp_replace(TG_TABLE_NAME, '^inspection_history_', '');
  vehicles_table_name := 'drivermgm.vehicles_' || company_suffix;
  
  -- 정기점검 정보를 vehicles 테이블에 업데이트
  EXECUTE format(
    'UPDATE %s SET 
      last_inspection_date = $1,
      inspection_result = $2,
      inspection_name = $3,
      inspection_notes = $4,
      updated_at = NOW() 
    WHERE id = $5',
    vehicles_table_name
  ) USING NEW.inspection_date, NEW.inspection_result, NEW.inspection_name, NEW.inspection_notes, NEW.vehicle_id;
  
  RAISE NOTICE 'Updated inspection data for vehicle_id % in %', NEW.vehicle_id, vehicles_table_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- human 회사 정기점검 트리거
CREATE TRIGGER sync_inspection_to_vehicles_human
AFTER INSERT ON drivermgm.inspection_history_human
FOR EACH ROW
EXECUTE FUNCTION drivermgm.sync_inspection_to_vehicles();

-- kukdong 회사 정기점검 트리거
CREATE TRIGGER sync_inspection_to_vehicles_kukdong
AFTER INSERT ON drivermgm.inspection_history_kukdong
FOR EACH ROW
EXECUTE FUNCTION drivermgm.sync_inspection_to_vehicles();

-- 코멘트 추가
COMMENT ON FUNCTION drivermgm.sync_vehicle_maintenance_fields() IS '정비 이력을 vehicles 테이블에 자동 반영 (모든 회사 공통)';
COMMENT ON FUNCTION drivermgm.sync_refueling_to_vehicles() IS '주유 이력을 vehicles 테이블에 자동 반영 (모든 회사 공통)';
COMMENT ON FUNCTION drivermgm.sync_monthly_mileage_to_vehicles() IS '월간주행거리를 vehicles 테이블에 자동 반영 (모든 회사 공통)';
COMMENT ON FUNCTION drivermgm.sync_inspection_to_vehicles() IS '정기점검을 vehicles 테이블에 자동 반영 (모든 회사 공통)';
