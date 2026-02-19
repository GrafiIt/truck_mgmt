-- vehicle_field_history 테이블에 text_value2 컬럼 추가
ALTER TABLE vehicle_field_history ADD COLUMN IF NOT EXISTS text_value2 TEXT;

-- vehicle_field_history_k 테이블에도 동일한 컬럼 추가
ALTER TABLE vehicle_field_history_k ADD COLUMN IF NOT EXISTS text_value2 TEXT;
