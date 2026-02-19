-- 053_check_and_fix_incorrect_total_mileage.sql
-- 잘못된 total_mileage 값을 찾아서 수정
-- 각 차량의 가장 최근(highest) 주유 기록의 주행거리로 total_mileage를 수정

-- HUMAN 회사의 차량들 수정
DO $$
DECLARE
  vehicle_record RECORD;
  max_refuel_mileage INTEGER;
BEGIN
  -- 모든 차량을 순회하며 처리
  FOR vehicle_record IN 
    SELECT id, vehicle_number, total_mileage 
    FROM drivermgm.vehicles_human
  LOOP
    -- 해당 차량의 주유 기록 중 가장 큰 주행거리 찾기
    SELECT MAX(mileage_value)
    INTO max_refuel_mileage
    FROM drivermgm.vehicle_field_history_human
    WHERE vehicle_id = vehicle_record.id
      AND field_name = 'refueling'
      AND mileage_value IS NOT NULL;
    
    -- 주유 기록이 있고, 현재 total_mileage와 다른 경우 업데이트
    IF max_refuel_mileage IS NOT NULL AND max_refuel_mileage != COALESCE(vehicle_record.total_mileage, 0) THEN
      UPDATE drivermgm.vehicles_human
      SET total_mileage = max_refuel_mileage,
          updated_at = NOW()
      WHERE id = vehicle_record.id;
      
      RAISE NOTICE 'Updated vehicle_human % (%): old total_mileage = %, new = %',
        vehicle_record.id, vehicle_record.vehicle_number, vehicle_record.total_mileage, max_refuel_mileage;
    END IF;
  END LOOP;
END $$;

-- KUKDONG 회사의 차량들 수정
DO $$
DECLARE
  vehicle_record RECORD;
  max_refuel_mileage INTEGER;
BEGIN
  -- 모든 차량을 순회하며 처리
  FOR vehicle_record IN 
    SELECT id, vehicle_number, total_mileage 
    FROM drivermgm.vehicles_kukdong
  LOOP
    -- 해당 차량의 주유 기록 중 가장 큰 주행거리 찾기
    SELECT MAX(mileage_value)
    INTO max_refuel_mileage
    FROM drivermgm.vehicle_field_history_kukdong
    WHERE vehicle_id = vehicle_record.id
      AND field_name = 'refueling'
      AND mileage_value IS NOT NULL;
    
    -- 주유 기록이 있고, 현재 total_mileage와 다른 경우 업데이트
    IF max_refuel_mileage IS NOT NULL AND max_refuel_mileage != COALESCE(vehicle_record.total_mileage, 0) THEN
      UPDATE drivermgm.vehicles_kukdong
      SET total_mileage = max_refuel_mileage,
          updated_at = NOW()
      WHERE id = vehicle_record.id;
      
      RAISE NOTICE 'Updated vehicle_kukdong % (%): old total_mileage = %, new = %',
        vehicle_record.id, vehicle_record.vehicle_number, vehicle_record.total_mileage, max_refuel_mileage;
    END IF;
  END LOOP;
END $$;

-- 결과 확인 쿼리 (선택사항)
-- SELECT 
--   v.vehicle_number,
--   v.total_mileage as current_total_mileage,
--   MAX(h.mileage_value) as max_refuel_mileage
-- FROM drivermgm.vehicles_human v
-- LEFT JOIN drivermgm.vehicle_field_history_human h 
--   ON v.id = h.vehicle_id AND h.field_name = 'refueling'
-- GROUP BY v.id, v.vehicle_number, v.total_mileage
-- ORDER BY v.vehicle_number;
