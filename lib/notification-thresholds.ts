export interface NotificationThreshold {
  vehicle_type: string
  grease_days_red: number
  grease_days_blue: number
  engine_oil_days_red: number
  engine_oil_days_blue: number
  engine_oil_km_red: number
  engine_oil_km_blue: number
  mission_oil_km_red: number
  mission_oil_km_blue: number
  diesel_filter_km_red: number
  diesel_filter_km_blue: number
  defu_oil_days_red: number
  defu_oil_days_blue: number
  tire_days_red: number
  tire_days_blue: number
  dry_filter_days_red: number
  dry_filter_days_blue: number
  water_separator_days_red: number
  water_separator_days_blue: number
  lining_days_red: number
  lining_days_blue: number
  battery_days_red: number
  battery_days_blue: number
  air_tank_days_red: number
  air_tank_days_blue: number
  axle_bearing_days_red: number
  axle_bearing_days_blue: number
}

// Default thresholds (fallback when no vehicle type match)
const DEFAULT_THRESHOLD: NotificationThreshold = {
  vehicle_type: "default",
  grease_days_red: 30,
  grease_days_blue: 23,
  engine_oil_days_red: 180,
  engine_oil_days_blue: 173,
  engine_oil_km_red: 20000,
  engine_oil_km_blue: 15000,
  mission_oil_km_red: 40000,
  mission_oil_km_blue: 35000,
  diesel_filter_km_red: 40000,
  diesel_filter_km_blue: 35000,
  defu_oil_days_red: 365,
  defu_oil_days_blue: 358,
  tire_days_red: 180,
  tire_days_blue: 178,
  dry_filter_days_red: 365,
  dry_filter_days_blue: 358,
  water_separator_days_red: 365,
  water_separator_days_blue: 358,
  lining_days_red: 1095,
  lining_days_blue: 1088,
  battery_days_red: 1095,
  battery_days_blue: 1088,
  air_tank_days_red: 1095,
  air_tank_days_blue: 1088,
  axle_bearing_days_red: 1460,
  axle_bearing_days_blue: 1453,
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

  const today = new Date()
  const itemDate = date ? new Date(date) : null
  const daysDiff = itemDate ? Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
  const mileageDiff = mileage ? totalMileage - mileage : 0

  switch (itemName) {
    case "구리스":
      return daysDiff >= threshold.grease_days_red
    case "엔진오일":
      return daysDiff >= threshold.engine_oil_days_red || mileageDiff >= threshold.engine_oil_km_red
    case "미션오일":
      return mileageDiff >= threshold.mission_oil_km_red
    case "경유필터":
      return mileageDiff >= threshold.diesel_filter_km_red
    case "데후오일":
      return daysDiff >= threshold.defu_oil_days_red
    case "타이어":
      return daysDiff >= threshold.tire_days_red
    case "드라이필터":
      return daysDiff >= threshold.dry_filter_days_red
    case "수분분리기":
      return daysDiff >= threshold.water_separator_days_red
    case "라이닝":
      return daysDiff >= threshold.lining_days_red
    case "배터리":
      return daysDiff >= threshold.battery_days_red
    case "에어탱크":
      return daysDiff >= threshold.air_tank_days_red
    case "축베어링":
      return daysDiff >= threshold.axle_bearing_days_red
    case "히터":
    case "기타":
      return daysDiff >= 365
    case "정기검사":
      return daysDiff >= 180
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

  const today = new Date()
  const itemDate = date ? new Date(date) : null
  const daysDiff = itemDate ? Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
  const mileageDiff = mileage ? totalMileage - mileage : 0

  switch (itemName) {
    case "구리스":
      return daysDiff >= threshold.grease_days_blue && daysDiff < threshold.grease_days_red
    case "엔진오일":
      return (
        (daysDiff >= threshold.engine_oil_days_blue && daysDiff < threshold.engine_oil_days_red) ||
        (mileageDiff >= threshold.engine_oil_km_blue && mileageDiff < threshold.engine_oil_km_red)
      )
    case "미션오일":
      return mileageDiff >= threshold.mission_oil_km_blue && mileageDiff < threshold.mission_oil_km_red
    case "경유필터":
      return mileageDiff >= threshold.diesel_filter_km_blue && mileageDiff < threshold.diesel_filter_km_red
    case "데후오일":
      return daysDiff >= threshold.defu_oil_days_blue && daysDiff < threshold.defu_oil_days_red
    case "타이어":
      return daysDiff >= threshold.tire_days_blue && daysDiff < threshold.tire_days_red
    case "드라이필터":
      return daysDiff >= threshold.dry_filter_days_blue && daysDiff < threshold.dry_filter_days_red
    case "수분분리기":
      return daysDiff >= threshold.water_separator_days_blue && daysDiff < threshold.water_separator_days_red
    case "라이닝":
      return daysDiff >= threshold.lining_days_blue && daysDiff < threshold.lining_days_red
    case "배터리":
      return daysDiff >= threshold.battery_days_blue && daysDiff < threshold.battery_days_red
    case "에어탱크":
      return daysDiff >= threshold.air_tank_days_blue && daysDiff < threshold.air_tank_days_red
    case "축베어링":
      return daysDiff >= threshold.axle_bearing_days_blue && daysDiff < threshold.axle_bearing_days_red
    case "히터":
    case "기타":
      return daysDiff >= 358 && daysDiff < 365
    case "정기검사":
      return daysDiff >= 150 && daysDiff < 180
    default:
      return false
  }
}

export function getHighlightClass(isHighlight: boolean, isWarn: boolean): string {
  if (isHighlight) return "font-bold text-red-600"
  if (isWarn) return "font-bold text-blue-600"
  return ""
}
