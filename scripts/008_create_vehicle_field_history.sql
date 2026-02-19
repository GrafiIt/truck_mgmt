-- 차량 필드 업데이트 이력 테이블 생성
CREATE TABLE IF NOT EXISTS vehicle_field_history (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  field_label VARCHAR(100) NOT NULL,
  date_value DATE,
  mileage_value INTEGER,
  text_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_vehicle_field_history_vehicle_id ON vehicle_field_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_field_history_maintenance_date ON vehicle_field_history(maintenance_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_field_history_field_name ON vehicle_field_history(field_name);

-- RLS 정책 추가
ALTER TABLE vehicle_field_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" ON vehicle_field_history
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for anon users" ON vehicle_field_history
  FOR INSERT WITH CHECK (true);

-- 기존 maintenance_records 테이블 데이터 마이그레이션 (선택사항)
-- INSERT INTO vehicle_field_history (vehicle_id, maintenance_date, field_name, field_label, text_value)
-- SELECT vehicle_id, maintenance_date, 'description', '내역', description
-- FROM maintenance_records;
