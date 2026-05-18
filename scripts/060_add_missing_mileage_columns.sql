-- 누락된 정비항목 mileage 컬럼 추가
-- 모든 정비항목이 날짜와 주행거리 둘 다 저장할 수 있도록 함

-- 에어드라이어 - mileage 컬럼 추가 (date는 이미 존재)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS air_dryer_mileage INTEGER;

-- 에어탱크 - mileage 컬럼 추가 (date는 이미 존재)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS air_tank_mileage INTEGER;

-- 축베어링 - mileage 컬럼 추가 (date는 이미 존재)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS axle_bearing_mileage INTEGER;

-- 라이닝 - mileage 컬럼 추가 (date는 이미 존재)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lining_mileage INTEGER;

-- PTO조인트 - mileage 컬럼 추가 (date는 이미 존재)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS pto_joint_mileage INTEGER;

-- PTO펌프 - mileage 컬럼 추가 (date는 이미 존재)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS pto_pump_mileage INTEGER;

-- 히터 - mileage 컬럼 추가 (date는 이미 존재)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS heater_mileage INTEGER;

-- 드라이필터 - date 컬럼 추가 (mileage는 이미 존재)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dry_filter_date DATE;

-- 수분분리기 - date 컬럼 추가 (mileage는 이미 존재)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS water_separator_date DATE;

-- 파워오일 - mileage 컬럼 추가 (date는 이미 존재)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS power_oil_mileage INTEGER;

-- 기타 - mileage 컬럼 추가 (date, summary는 이미 존재)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS others_mileage INTEGER;
