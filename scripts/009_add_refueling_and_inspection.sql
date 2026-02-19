-- 주유 관련 컬럼 추가
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS fuel_efficiency DECIMAL(10, 2), -- 연비 (km/L)
ADD COLUMN IF NOT EXISTS last_refuel_date DATE, -- 마지막 주유일
ADD COLUMN IF NOT EXISTS last_refuel_mileage INTEGER, -- 마지막 주유 시 주행거리
ADD COLUMN IF NOT EXISTS inspection_name VARCHAR(255), -- 정기검사명
ADD COLUMN IF NOT EXISTS inspection_result VARCHAR(10) DEFAULT 'No'; -- 정기점검결과

-- 주유 이력 테이블 생성
CREATE TABLE IF NOT EXISTS refueling_history (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  refuel_date DATE NOT NULL, -- 주유실행일
  mileage INTEGER NOT NULL, -- 주행거리
  fuel_amount DECIMAL(10, 2) NOT NULL, -- 주유량 (리터)
  fuel_cost INTEGER NOT NULL, -- 주유비
  maintenance_date DATE NOT NULL, -- 입력 일자
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 정기검사 이력 테이블 생성
CREATE TABLE IF NOT EXISTS inspection_history (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL, -- 정기점검 수검일
  inspection_name VARCHAR(255) NOT NULL, -- 정기점검명
  inspection_result VARCHAR(10) DEFAULT 'No', -- 정기점검결과
  maintenance_date DATE NOT NULL, -- 입력 일자
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RLS 정책 추가
ALTER TABLE refueling_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_history ENABLE ROW LEVEL SECURITY;

-- Policy가 이미 존재하면 무시하도록 DROP IF EXISTS 추가
DO $$ 
BEGIN
  -- refueling_history policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'refueling_history' AND policyname = 'Allow anon to read refueling_history') THEN
    CREATE POLICY "Allow anon to read refueling_history" ON refueling_history FOR SELECT TO anon USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'refueling_history' AND policyname = 'Allow anon to insert refueling_history') THEN
    CREATE POLICY "Allow anon to insert refueling_history" ON refueling_history FOR INSERT TO anon WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'refueling_history' AND policyname = 'Allow anon to update refueling_history') THEN
    CREATE POLICY "Allow anon to update refueling_history" ON refueling_history FOR UPDATE TO anon USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'refueling_history' AND policyname = 'Allow anon to delete refueling_history') THEN
    CREATE POLICY "Allow anon to delete refueling_history" ON refueling_history FOR DELETE TO anon USING (true);
  END IF;

  -- inspection_history policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inspection_history' AND policyname = 'Allow anon to read inspection_history') THEN
    CREATE POLICY "Allow anon to read inspection_history" ON inspection_history FOR SELECT TO anon USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inspection_history' AND policyname = 'Allow anon to insert inspection_history') THEN
    CREATE POLICY "Allow anon to insert inspection_history" ON inspection_history FOR INSERT TO anon WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inspection_history' AND policyname = 'Allow anon to update inspection_history') THEN
    CREATE POLICY "Allow anon to update inspection_history" ON inspection_history FOR UPDATE TO anon USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inspection_history' AND policyname = 'Allow anon to delete inspection_history') THEN
    CREATE POLICY "Allow anon to delete inspection_history" ON inspection_history FOR DELETE TO anon USING (true);
  END IF;
END $$;
