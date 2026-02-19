-- 데후오일과 타이어 사이에 추가할 컬럼들
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS power_oil_mileage INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS air_dryer_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dry_filter_mileage INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS water_separator_mileage INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lining_date DATE;

-- 배터리 뒤에 추가할 컬럼들
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS air_tank_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS axle_bearing_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tire_replacement_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS pto_joint_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS pto_pump_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS heater_date DATE;

-- 기존 컬럼 정리 (이미 있는 컬럼들은 건너뜀)
-- power_oil_date는 이미 존재
-- air_dryer_date는 위에서 추가
-- dry_filter_date는 이미 존재하지만 mileage만 사용
-- water_separator_date는 이미 존재하지만 mileage만 사용
-- lining_date는 위에서 추가
-- air_tank_date는 위에서 추가
-- axle_bearing_date는 위에서 추가
-- tire_date는 이미 존재하지만 tire_replacement_date로 별도 추가
-- pto_joint_date는 위에서 추가
-- pto_pump_date는 위에서 추가
-- heater_date는 위에서 추가
