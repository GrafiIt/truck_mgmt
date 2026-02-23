-- 057_add_last_refuel_amount_to_vehicles.sql
-- vehicles 테이블에 마지막 주유량 컬럼 추가

-- last_refuel_amount 컬럼 추가 (마지막 주유량을 리터 단위로 저장)
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS last_refuel_amount DECIMAL(10, 2) DEFAULT 0;

-- 설명: 
-- last_refuel_amount는 가장 최근 주유 시 입력한 주유량을 저장합니다.
-- 다음 주유 시 연비를 계산할 때 이 값을 사용합니다.
-- 연비 = (현재 주행거리 - 이전 주행거리) / last_refuel_amount
