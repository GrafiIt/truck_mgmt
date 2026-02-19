-- 차량 정보 테이블
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  transporter VARCHAR(100),
  driver_name VARCHAR(100),
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  manufacturer VARCHAR(50),
  release_date DATE,
  vehicle_age DECIMAL(3,1),
  total_mileage INTEGER DEFAULT 0,
  last_inspection_date DATE,
  inspection_result VARCHAR(20),
  
  -- 정비 항목별 최근 정비 정보
  grease_date DATE,
  grease_mileage INTEGER,
  engine_oil_date DATE,
  engine_oil_mileage INTEGER,
  mission_oil_date DATE,
  mission_oil_mileage INTEGER,
  diesel_filter_date DATE,
  diesel_filter_mileage INTEGER,
  defu_oil_date DATE,
  defu_oil_mileage INTEGER,
  power_oil_date DATE,
  power_oil_mileage INTEGER,
  air_dryer_date DATE,
  air_dryer_mileage INTEGER,
  dry_filter_date DATE,
  dry_filter_mileage INTEGER,
  water_separator_date DATE,
  water_separator_mileage INTEGER,
  lining_date DATE,
  lining_mileage INTEGER,
  battery_date DATE,
  battery_mileage INTEGER,
  air_tank_date DATE,
  air_tank_mileage INTEGER,
  axle_bearing_date DATE,
  axle_bearing_mileage INTEGER,
  tire_date DATE,
  tire_mileage INTEGER,
  pto_joint_date DATE,
  pto_joint_mileage INTEGER,
  pto_pump_date DATE,
  pto_pump_mileage INTEGER,
  heater_date DATE,
  heater_mileage INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 정비 이력 테이블
CREATE TABLE IF NOT EXISTS maintenance_records (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  driver_name VARCHAR(100),
  mileage INTEGER,
  description TEXT,
  repair_shop VARCHAR(200),
  cost INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_vehicles_number ON vehicles(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_records(maintenance_date DESC);

-- RLS 정책 설정
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 허용
CREATE POLICY "Allow public read access on vehicles" ON vehicles
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on maintenance_records" ON maintenance_records
  FOR SELECT USING (true);

-- anon 역할이 모든 작업을 수행할 수 있도록 허용
CREATE POLICY "Allow anon all access on vehicles" ON vehicles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon all access on maintenance_records" ON maintenance_records
  FOR ALL USING (true) WITH CHECK (true);

-- 샘플 데이터 삽입
INSERT INTO vehicles (
  transporter, driver_name, vehicle_number, manufacturer, release_date, vehicle_age,
  total_mileage, last_inspection_date, inspection_result,
  grease_date, grease_mileage, engine_oil_date, engine_oil_mileage,
  tire_date, tire_mileage, battery_date, battery_mileage
) VALUES
('휴먼로지텍(주)', '최지호', '부산94아2326', 'HYUNDAI', '2017-10-17', 8.0,
 603933, '2025-10-17', 'No',
 '2025-10-22', 603933, '2025-04-24', 593620,
 '2025-06-02', 595047, '2025-09-22', 602596),
 
('휴먼로지텍(주)', '윤철호', '부산96아1371', 'HYUNDAI', '2017-05-01', 8.5,
 602085, '2025-05-10', 'Pass',
 '2025-09-25', 602085, NULL, NULL,
 NULL, NULL, '2025-09-10', 602085),
 
('휴먼로지텍(주)', '김의중', '울산81아8848', 'HYUNDAI', '2017-10-17', 8.0,
 60621, '2025-09-10', 'Pass',
 '2025-08-26', 60621, '2025-02-03', 60621,
 '2025-10-21', 60621, '2025-03-26', 60621);

-- 샘플 정비 이력 데이터
INSERT INTO maintenance_records (vehicle_id, maintenance_date, driver_name, mileage, description, repair_shop, cost, notes)
VALUES
(1, '2025-10-22', '최지호', 603933, '엔진오일(+필터) 경유필터 세차 구리스', '극동세차장', 483000, ''),
(1, '2025-10-20', '최지호', 603667, 'PTO 조인트 교체 / 실장갑', '부일공업사', 184800, ''),
(1, '2025-10-17', '최지호', 603542, '정기검사', '현대기아남구점', 60000, ''),
(1, '2025-09-23', '최지호', 602681, '해드경고등 (마그네트밸브교환 배선점검및수리', '강진정비', 308000, ''),
(1, '2025-09-22', '최지호', 602596, '배터리 교체', 'BS금성', 352000, ''),
(2, '2025-09-25', '윤철호', 602085, '정기검사', '현대기아남구점', 60000, 'Pass'),
(2, '2025-09-10', '윤철호', 602085, '전면 유리 작업', '삼일자동차유리', 990000, ''),
(2, '2025-09-10', '윤철호', 602085, '밧데리 공임 외', '통운밧데리', 99000, '');
