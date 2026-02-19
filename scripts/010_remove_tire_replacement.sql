-- 타이어교체 컬럼 삭제
ALTER TABLE vehicles DROP COLUMN IF EXISTS tire_replacement_date;

-- vehicle_field_history 테이블에서 타이어교체 관련 레코드 삭제
DELETE FROM vehicle_field_history WHERE field_name = 'tire_replacement';
