-- 정비 항목 최종 저장값을 vehicles 테이블에 자동 반영하는 트리거
-- vehicle_field_history에 새 기록이 INSERT될 때 실행됨

CREATE OR REPLACE FUNCTION update_vehicle_maintenance_fields()
RETURNS TRIGGER AS $$
DECLARE
  table_suffix TEXT;
  vehicles_table TEXT;
BEGIN
  -- 테이블 이름에서 회사 코드 추출 (예: vehicle_field_history_human -> human)
  table_suffix := substring(TG_TABLE_NAME from 'vehicle_field_history_(.+)$');
  vehicles_table := 'vehicles_' || table_suffix;

  -- 정비 항목별로 vehicles 테이블의 해당 컬럼 업데이트
  -- "연비", "기타", "refueling", "monthly_mileage"는 제외
  IF NEW.field_name IN ('grease', 'brake_fluid', 'battery', 'wiper', 'wheel_alignment', 'air_filter', 'air_dryer') THEN
    EXECUTE format('
      UPDATE %I 
      SET 
        %I = $1,
        %I = $2,
        updated_at = NOW()
      WHERE id = $3
    ', vehicles_table, 
       NEW.field_name || '_date',
       NEW.field_name || '_mileage')
    USING NEW.date_value, NEW.mileage_value, NEW.vehicle_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- human 회사용 트리거
DROP TRIGGER IF EXISTS update_maintenance_fields_human ON vehicle_field_history_human;
CREATE TRIGGER update_maintenance_fields_human
  AFTER INSERT ON vehicle_field_history_human
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_maintenance_fields();

-- kukdong 회사용 트리거
DROP TRIGGER IF EXISTS update_maintenance_fields_kukdong ON vehicle_field_history_kukdong;
CREATE TRIGGER update_maintenance_fields_kukdong
  AFTER INSERT ON vehicle_field_history_kukdong
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_maintenance_fields();

COMMENT ON FUNCTION update_vehicle_maintenance_fields() IS '정비 기록 저장 시 vehicles 테이블의 최종 저장값 자동 업데이트';
