export interface NotificationThreshold {
  vehicle_type: string
  // 구리스 (Grease)
  grease_days_red: number
  grease_days_blue: number
  grease_km_red: number
  grease_km_blue: number
  // 엔진오일 (Engine Oil)
  engine_oil_days_red: number
  engine_oil_days_blue: number
  engine_oil_km_red: number
  engine_oil_km_blue: number
  // 미션오일 (Mission Oil)
  mission_oil_days_red: number
  mission_oil_days_blue: number
  mission_oil_km_red: number
  mission_oil_km_blue: number
  // 경유필터 (Diesel Filter)
  diesel_filter_days_red: number
  diesel_filter_days_blue: number
  diesel_filter_km_red: number
  diesel_filter_km_blue: number
  // 데후오일 (Defu Oil)
  defu_oil_days_red: number
  defu_oil_days_blue: number
  defu_oil_km_red: number
  defu_oil_km_blue: number
  // 타이어 (Tire)
  tire_days_red: number
  tire_days_blue: number
  tire_km_red: number
  tire_km_blue: number
  // 드라이필터 (Dry Filter)
  dry_filter_days_red: number
  dry_filter_days_blue: number
  dry_filter_km_red: number
  dry_filter_km_blue: number
  // 수분분리기 (Water Separator)
  water_separator_days_red: number
  water_separator_days_blue: number
  water_separator_km_red: number
  water_separator_km_blue: number
  // 라이닝 (Lining)
  lining_days_red: number
  lining_days_blue: number
  lining_km_red: number
  lining_km_blue: number
  // 배터리 (Battery)
  battery_days_red: number
  battery_days_blue: number
  battery_km_red: number
  battery_km_blue: number
  // 에어탱크 (Air Tank)
  air_tank_days_red: number
  air_tank_days_blue: number
  air_tank_km_red: number
  air_tank_km_blue: number
  // 축베어링 (Axle Bearing)
  axle_bearing_days_red: number
  axle_bearing_days_blue: number
  axle_bearing_km_red: number
  axle_bearing_km_blue: number
  // 파워오일 (Power Oil)
  power_oil_days_red: number
  power_oil_days_blue: number
  power_oil_km_red: number
  power_oil_km_blue: number
  // 에어드라이어 (Air Dryer)
  air_dryer_days_red: number
  air_dryer_days_blue: number
  air_dryer_km_red: number
  air_dryer_km_blue: number
  // PTO조인트 (PTO Joint)
  pto_joint_days_red: number
  pto_joint_days_blue: number
  pto_joint_km_red: number
  pto_joint_km_blue: number
  // 히터 (Heater)
  heater_days_red: number
  heater_days_blue: number
  heater_km_red: number
  heater_km_blue: number
  // 정기검사 알림 기준 (일)
  inspection_days_red: number
  inspection_days_blue: number
  // 경고 비활성화 항목 목록
  disabled_warnings?: string[]
}

// Default thresholds (fallback when no vehicle type match)
// 새로 추가되는 days 기본값: 3650, km 기본값: 999999 (사실상 알림 비활성)
const DEFAULT_THRESHOLD: NotificationThreshold = {
  vehicle_type: "default",
  // 구리스
  grease_days_red: 30,
  grease_days_blue: 23,
  grease_km_red: 999999,
  grease_km_blue: 999999,
  // 엔진오일
  engine_oil_days_red: 180,
  engine_oil_days_blue: 173,
  engine_oil_km_red: 20000,
  engine_oil_km_blue: 15000,
  // 미션오일
  mission_oil_days_red: 3650,
  mission_oil_days_blue: 3650,
  mission_oil_km_red: 40000,
  mission_oil_km_blue: 35000,
  // 경유필터
  diesel_filter_days_red: 3650,
  diesel_filter_days_blue: 3650,
  diesel_filter_km_red: 40000,
  diesel_filter_km_blue: 35000,
  // 데후오일
  defu_oil_days_red: 365,
  defu_oil_days_blue: 358,
  defu_oil_km_red: 999999,
  defu_oil_km_blue: 999999,
  // 타이어
  tire_days_red: 180,
  tire_days_blue: 178,
  tire_km_red: 999999,
  tire_km_blue: 999999,
  // 드라이필터
  dry_filter_days_red: 365,
  dry_filter_days_blue: 358,
  dry_filter_km_red: 999999,
  dry_filter_km_blue: 999999,
  // 수분분리기
  water_separator_days_red: 365,
  water_separator_days_blue: 358,
  water_separator_km_red: 999999,
  water_separator_km_blue: 999999,
  // 라이닝
  lining_days_red: 1095,
  lining_days_blue: 1088,
  lining_km_red: 999999,
  lining_km_blue: 999999,
  // 배터리
  battery_days_red: 1095,
  battery_days_blue: 1088,
  battery_km_red: 999999,
  battery_km_blue: 999999,
  // 에어탱크
  air_tank_days_red: 1095,
  air_tank_days_blue: 1088,
  air_tank_km_red: 999999,
  air_tank_km_blue: 999999,
  // 축베어링
  axle_bearing_days_red: 1460,
  axle_bearing_days_blue: 1453,
  axle_bearing_km_red: 999999,
  axle_bearing_km_blue: 999999,
  // 파워오일
  power_oil_days_red: 365,
  power_oil_days_blue: 358,
  power_oil_km_red: 999999,
  power_oil_km_blue: 999999,
  // 에어드라이어
  air_dryer_days_red: 365,
  air_dryer_days_blue: 358,
  air_dryer_km_red: 999999,
  air_dryer_km_blue: 999999,
  // PTO조인트
  pto_joint_days_red: 365,
  pto_joint_days_blue: 358,
  pto_joint_km_red: 999999,
  pto_joint_km_blue: 999999,
  // 히터
  heater_days_red: 365,
  heater_days_blue: 358,
  heater_km_red: 999999,
  heater_km_blue: 999999,
  // 정기검사 기본값: 경고 150일 이상, 위험 180일 이상
  inspection_days_red: 180,
  inspection_days_blue: 150,
}

export function getThresholdForVehicleType(
  vehicleType: string | null | undefined,
  thresholds: NotificationThreshold[]
): NotificationThreshold {
  if (!vehicleType) return DEFAULT_THRESHOLD
  const match = thresholds.find((t) => t.vehicle_type === vehicleType)
  return match || DEFAULT_THRESHOLD
}

export function shouldHighlightWithThreshold(
  itemName: string,
  date: string | null,
  mileage: number | null,
  totalMileage: number,
  threshold: NotificationThreshold
): boolean {
  if (!date && !mileage) return false
  // 경고 비활성화 항목인 경우 색상 표시 안 함
  if (threshold.disabled_warnings && threshold.disabled_warnings.includes(itemName)) return false

  const today = new Date()
  const itemDate = date ? new Date(date) : null
  const daysDiff = itemDate ? Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
  const mileageDiff = mileage ? totalMileage - mileage : 0

  switch (itemName) {
    case "구리스":
      return daysDiff >= threshold.grease_days_red || mileageDiff >= threshold.grease_km_red
    case "엔진오일":
      return daysDiff >= threshold.engine_oil_days_red || mileageDiff >= threshold.engine_oil_km_red
    case "미션오일":
      return daysDiff >= threshold.mission_oil_days_red || mileageDiff >= threshold.mission_oil_km_red
    case "경유필터":
      return daysDiff >= threshold.diesel_filter_days_red || mileageDiff >= threshold.diesel_filter_km_red
    case "데후오일":
      return daysDiff >= threshold.defu_oil_days_red || mileageDiff >= threshold.defu_oil_km_red
    case "타이어":
      return daysDiff >= threshold.tire_days_red || mileageDiff >= threshold.tire_km_red
    case "드라이필터":
      return daysDiff >= threshold.dry_filter_days_red || mileageDiff >= threshold.dry_filter_km_red
    case "수분분리기":
      return daysDiff >= threshold.water_separator_days_red || mileageDiff >= threshold.water_separator_km_red
    case "라이닝":
      return daysDiff >= threshold.lining_days_red || mileageDiff >= threshold.lining_km_red
    case "배터리":
      return daysDiff >= threshold.battery_days_red || mileageDiff >= threshold.battery_km_red
    case "에어탱크":
      return daysDiff >= threshold.air_tank_days_red || mileageDiff >= threshold.air_tank_km_red
    case "축베어링":
      return daysDiff >= threshold.axle_bearing_days_red || mileageDiff >= threshold.axle_bearing_km_red
    case "파워오일":
      return daysDiff >= threshold.power_oil_days_red || mileageDiff >= threshold.power_oil_km_red
    case "에어드라이어":
      return daysDiff >= threshold.air_dryer_days_red || mileageDiff >= threshold.air_dryer_km_red
    case "PTO조인트":
      return daysDiff >= threshold.pto_joint_days_red || mileageDiff >= threshold.pto_joint_km_red
    case "히터":
      return daysDiff >= threshold.heater_days_red || mileageDiff >= threshold.heater_km_red
    case "기타":
      return daysDiff >= 365
    case "정기검사":
      return daysDiff >= (threshold.inspection_days_red ?? 180)
    default:
      return false
  }
}

export function shouldWarnWithThreshold(
  itemName: string,
  date: string | null,
  mileage: number | null,
  totalMileage: number,
  threshold: NotificationThreshold
): boolean {
  if (!date && !mileage) return false
  // 경고 비활성화 항목인 경우 색상 표시 안 함
  if (threshold.disabled_warnings && threshold.disabled_warnings.includes(itemName)) return false

  const today = new Date()
  const itemDate = date ? new Date(date) : null
  const daysDiff = itemDate ? Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
  const mileageDiff = mileage ? totalMileage - mileage : 0

  switch (itemName) {
    case "구리스":
      return (
        (daysDiff >= threshold.grease_days_blue && daysDiff < threshold.grease_days_red) ||
        (mileageDiff >= threshold.grease_km_blue && mileageDiff < threshold.grease_km_red)
      )
    case "엔진오일":
      return (
        (daysDiff >= threshold.engine_oil_days_blue && daysDiff < threshold.engine_oil_days_red) ||
        (mileageDiff >= threshold.engine_oil_km_blue && mileageDiff < threshold.engine_oil_km_red)
      )
    case "미션오일":
      return (
        (daysDiff >= threshold.mission_oil_days_blue && daysDiff < threshold.mission_oil_days_red) ||
        (mileageDiff >= threshold.mission_oil_km_blue && mileageDiff < threshold.mission_oil_km_red)
      )
    case "경유필터":
      return (
        (daysDiff >= threshold.diesel_filter_days_blue && daysDiff < threshold.diesel_filter_days_red) ||
        (mileageDiff >= threshold.diesel_filter_km_blue && mileageDiff < threshold.diesel_filter_km_red)
      )
    case "데후오일":
      return (
        (daysDiff >= threshold.defu_oil_days_blue && daysDiff < threshold.defu_oil_days_red) ||
        (mileageDiff >= threshold.defu_oil_km_blue && mileageDiff < threshold.defu_oil_km_red)
      )
    case "타이어":
      return (
        (daysDiff >= threshold.tire_days_blue && daysDiff < threshold.tire_days_red) ||
        (mileageDiff >= threshold.tire_km_blue && mileageDiff < threshold.tire_km_red)
      )
    case "드라이필터":
      return (
        (daysDiff >= threshold.dry_filter_days_blue && daysDiff < threshold.dry_filter_days_red) ||
        (mileageDiff >= threshold.dry_filter_km_blue && mileageDiff < threshold.dry_filter_km_red)
      )
    case "수분분리기":
      return (
        (daysDiff >= threshold.water_separator_days_blue && daysDiff < threshold.water_separator_days_red) ||
        (mileageDiff >= threshold.water_separator_km_blue && mileageDiff < threshold.water_separator_km_red)
      )
    case "라이닝":
      return (
        (daysDiff >= threshold.lining_days_blue && daysDiff < threshold.lining_days_red) ||
        (mileageDiff >= threshold.lining_km_blue && mileageDiff < threshold.lining_km_red)
      )
    case "배터리":
      return (
        (daysDiff >= threshold.battery_days_blue && daysDiff < threshold.battery_days_red) ||
        (mileageDiff >= threshold.battery_km_blue && mileageDiff < threshold.battery_km_red)
      )
    case "에어탱크":
      return (
        (daysDiff >= threshold.air_tank_days_blue && daysDiff < threshold.air_tank_days_red) ||
        (mileageDiff >= threshold.air_tank_km_blue && mileageDiff < threshold.air_tank_km_red)
      )
    case "축베어링":
      return (
        (daysDiff >= threshold.axle_bearing_days_blue && daysDiff < threshold.axle_bearing_days_red) ||
        (mileageDiff >= threshold.axle_bearing_km_blue && mileageDiff < threshold.axle_bearing_km_red)
      )
    case "파워오일":
      return (
        (daysDiff >= threshold.power_oil_days_blue && daysDiff < threshold.power_oil_days_red) ||
        (mileageDiff >= threshold.power_oil_km_blue && mileageDiff < threshold.power_oil_km_red)
      )
    case "에어드라이어":
      return (
        (daysDiff >= threshold.air_dryer_days_blue && daysDiff < threshold.air_dryer_days_red) ||
        (mileageDiff >= threshold.air_dryer_km_blue && mileageDiff < threshold.air_dryer_km_red)
      )
    case "PTO조인트":
      return (
        (daysDiff >= threshold.pto_joint_days_blue && daysDiff < threshold.pto_joint_days_red) ||
        (mileageDiff >= threshold.pto_joint_km_blue && mileageDiff < threshold.pto_joint_km_red)
      )
    case "히터":
      return (
        (daysDiff >= threshold.heater_days_blue && daysDiff < threshold.heater_days_red) ||
        (mileageDiff >= threshold.heater_km_blue && mileageDiff < threshold.heater_km_red)
      )
    case "기타":
      return daysDiff >= 358 && daysDiff < 365
    case "정기검사":
      const inspBlue = threshold.inspection_days_blue ?? 150
      const inspRed = threshold.inspection_days_red ?? 180
      return daysDiff >= inspBlue && daysDiff < inspRed
    default:
      return false
  }
}

export function getHighlightClass(isHighlight: boolean, isWarn: boolean): string {
  if (isHighlight) return "font-bold text-red-600"
  if (isWarn) return "font-bold text-blue-600"
  return ""
}
