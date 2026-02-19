-- Create notification thresholds table for vehicle type-specific maintenance thresholds
CREATE TABLE IF NOT EXISTS drivermgm.notification_thresholds (
  id SERIAL PRIMARY KEY,
  vehicle_type VARCHAR(20) NOT NULL UNIQUE,
  
  -- 구리스 (Grease)
  grease_days_red INTEGER DEFAULT 30,
  grease_days_blue INTEGER DEFAULT 23,
  
  -- 엔진오일 (Engine Oil)
  engine_oil_days_red INTEGER DEFAULT 180,
  engine_oil_days_blue INTEGER DEFAULT 173,
  engine_oil_km_red INTEGER DEFAULT 20000,
  engine_oil_km_blue INTEGER DEFAULT 15000,
  
  -- 미션오일 (Mission Oil)
  mission_oil_km_red INTEGER DEFAULT 40000,
  mission_oil_km_blue INTEGER DEFAULT 35000,
  
  -- 경유필터 (Diesel Filter)
  diesel_filter_km_red INTEGER DEFAULT 40000,
  diesel_filter_km_blue INTEGER DEFAULT 35000,
  
  -- 데후오일 (Defu Oil)
  defu_oil_days_red INTEGER DEFAULT 365,
  defu_oil_days_blue INTEGER DEFAULT 358,
  
  -- 타이어 (Tire)
  tire_days_red INTEGER DEFAULT 180,
  tire_days_blue INTEGER DEFAULT 178,
  
  -- 드라이필터 (Dry Filter)
  dry_filter_days_red INTEGER DEFAULT 365,
  dry_filter_days_blue INTEGER DEFAULT 358,
  
  -- 수분분리기 (Water Separator)
  water_separator_days_red INTEGER DEFAULT 365,
  water_separator_days_blue INTEGER DEFAULT 358,
  
  -- 라이닝 (Lining)
  lining_days_red INTEGER DEFAULT 1095,
  lining_days_blue INTEGER DEFAULT 1088,
  
  -- 배터리 (Battery)
  battery_days_red INTEGER DEFAULT 1095,
  battery_days_blue INTEGER DEFAULT 1088,
  
  -- 에어탱크 (Air Tank)
  air_tank_days_red INTEGER DEFAULT 1095,
  air_tank_days_blue INTEGER DEFAULT 1088,
  
  -- 축베어링 (Axle Bearing)
  axle_bearing_days_red INTEGER DEFAULT 1460,
  axle_bearing_days_blue INTEGER DEFAULT 1453,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on vehicle_type for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_thresholds_vehicle_type ON drivermgm.notification_thresholds(vehicle_type);

-- Insert default values for each vehicle type
INSERT INTO drivermgm.notification_thresholds (vehicle_type) VALUES 
  ('탱크로리'),
  ('25톤'),
  ('14톤'),
  ('11톤'),
  ('8톤'),
  ('5톤'),
  ('3.5톤'),
  ('2.5톤'),
  ('1.2톤'),
  ('1톤')
ON CONFLICT (vehicle_type) DO NOTHING;

-- Enable RLS
ALTER TABLE drivermgm.notification_thresholds ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all access for now
CREATE POLICY "Allow anon to read notification_thresholds" ON drivermgm.notification_thresholds
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon to update notification_thresholds" ON drivermgm.notification_thresholds
  FOR UPDATE TO anon USING (true);

COMMENT ON TABLE drivermgm.notification_thresholds IS '차량 종류별 정비 알림 기준 값 설정 테이블';
