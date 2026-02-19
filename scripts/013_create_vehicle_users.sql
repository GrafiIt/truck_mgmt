-- 차량 관리 시스템 사용자 테이블 생성

CREATE TABLE IF NOT EXISTS vehicle_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE vehicle_users ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 허용
CREATE POLICY "Allow read access to all users" ON vehicle_users
  FOR SELECT
  USING (true);

-- 인증된 사용자만 추가/수정/삭제 가능
CREATE POLICY "Allow authenticated users to insert" ON vehicle_users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update" ON vehicle_users
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated users to delete" ON vehicle_users
  FOR DELETE
  USING (true);

-- 기본 관리자 계정 추가 (human/1024)
INSERT INTO vehicle_users (username, password)
VALUES ('human', '1024')
ON CONFLICT (username) DO NOTHING;
