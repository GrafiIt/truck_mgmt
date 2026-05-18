-- 061_sync_existing_mileage_to_vehicles.sql
-- 기존 vehicle_field_history에 저장된 mileage_value를 vehicles 테이블에 반영
-- (060 스크립트 실행 후 실행)

-- Human 회사
UPDATE drivermgm.vehicles_human v
SET 
  air_dryer_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_human h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'air_dryer' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.air_dryer_mileage),
  air_tank_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_human h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'air_tank' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.air_tank_mileage),
  axle_bearing_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_human h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'axle_bearing' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.axle_bearing_mileage),
  lining_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_human h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'lining' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.lining_mileage),
  pto_joint_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_human h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'pto_joint' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.pto_joint_mileage),
  pto_pump_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_human h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'pto_pump' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.pto_pump_mileage),
  heater_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_human h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'heater' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.heater_mileage),
  dry_filter_date = COALESCE((
    SELECT h.date_value FROM drivermgm.vehicle_field_history_human h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'dry_filter' AND h.date_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.dry_filter_date),
  water_separator_date = COALESCE((
    SELECT h.date_value FROM drivermgm.vehicle_field_history_human h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'water_separator' AND h.date_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.water_separator_date),
  power_oil_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_human h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'power_oil' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.power_oil_mileage),
  updated_at = NOW();

-- Kukdong 회사
UPDATE drivermgm.vehicles_kukdong v
SET 
  air_dryer_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_kukdong h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'air_dryer' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.air_dryer_mileage),
  air_tank_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_kukdong h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'air_tank' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.air_tank_mileage),
  axle_bearing_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_kukdong h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'axle_bearing' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.axle_bearing_mileage),
  lining_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_kukdong h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'lining' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.lining_mileage),
  pto_joint_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_kukdong h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'pto_joint' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.pto_joint_mileage),
  pto_pump_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_kukdong h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'pto_pump' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.pto_pump_mileage),
  heater_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_kukdong h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'heater' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.heater_mileage),
  dry_filter_date = COALESCE((
    SELECT h.date_value FROM drivermgm.vehicle_field_history_kukdong h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'dry_filter' AND h.date_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.dry_filter_date),
  water_separator_date = COALESCE((
    SELECT h.date_value FROM drivermgm.vehicle_field_history_kukdong h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'water_separator' AND h.date_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.water_separator_date),
  power_oil_mileage = COALESCE((
    SELECT h.mileage_value FROM drivermgm.vehicle_field_history_kukdong h 
    WHERE h.vehicle_id = v.id AND h.field_name = 'power_oil' AND h.mileage_value IS NOT NULL
    ORDER BY h.maintenance_date DESC, h.id DESC LIMIT 1
  ), v.power_oil_mileage),
  updated_at = NOW();
