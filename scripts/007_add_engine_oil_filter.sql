-- 엔진오일 필터 컬럼 추가
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS engine_oil_filter_date DATE,
ADD COLUMN IF NOT EXISTS engine_oil_filter_mileage INTEGER;

COMMENT ON COLUMN vehicles.engine_oil_filter_date IS '엔진오일 필터 교체 날짜';
COMMENT ON COLUMN vehicles.engine_oil_filter_mileage IS '엔진오일 필터 교체 시 주행거리 (km)';
