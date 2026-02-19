-- 전월주행거리 컬럼 추가
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS last_monthly_mileage integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_monthly_mileage_date date DEFAULT NULL;
