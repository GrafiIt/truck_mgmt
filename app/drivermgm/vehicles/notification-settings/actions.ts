"use server"

import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * 쿠키에서 현재 회사 코드를 읽는다.
 * 없거나 읽을 수 없으면 null을 반환하고, 호출부에서 빈 결과/실패로 처리한다.
 */
async function getCompanyCode(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get("company_code")?.value

    if (!raw) {
      console.error("[v0] company_code 쿠키를 찾을 수 없습니다.")
      return null
    }

    let companyCode = raw
    try {
      companyCode = decodeURIComponent(raw)
    } catch {
      companyCode = raw
    }

    companyCode = companyCode.trim()
    if (!companyCode) {
      console.error("[v0] company_code 쿠키가 비어 있습니다.")
      return null
    }

    return companyCode
  } catch (error) {
    console.error("[v0] company_code 쿠키 추출 중 오류:", error)
    return null
  }
}

/**
 * 회사별 동적 테이블명. 예: getTableName("vehicles", "human") => "vehicles_human"
 */
function getTableName(base: string, companyCode: string): string {
  return `${base}_${companyCode}`
}

const NUMERIC_THRESHOLD_FIELDS = [
  "grease_days_red",
  "grease_days_blue",
  "engine_oil_days_red",
  "engine_oil_days_blue",
  "engine_oil_km_red",
  "engine_oil_km_blue",
  "mission_oil_km_red",
  "mission_oil_km_blue",
  "diesel_filter_km_red",
  "diesel_filter_km_blue",
  "defu_oil_days_red",
  "defu_oil_days_blue",
  "tire_days_red",
  "tire_days_blue",
  "dry_filter_days_red",
  "dry_filter_days_blue",
  "water_separator_days_red",
  "water_separator_days_blue",
  "lining_days_red",
  "lining_days_blue",
  "battery_days_red",
  "battery_days_blue",
  "air_tank_days_red",
  "air_tank_days_blue",
  "axle_bearing_days_red",
  "axle_bearing_days_blue",
  "inspection_days_red",
  "inspection_days_blue",
] as const

type NotificationThresholdRow = {
  company_code: string
  vehicle_type: string
  disabled_warnings: string[]
} & Record<(typeof NUMERIC_THRESHOLD_FIELDS)[number], number>

/**
 * 설정 행이 아직 없을 때 UI가 리다이렉트/크래시하지 않도록
 * vehicle_type만 채우고 숫자 필드는 전부 0인 기본 객체를 만든다.
 */
function createDefaultThreshold(vehicleType: string, companyCode: string): NotificationThresholdRow {
  const defaults = {
    company_code: companyCode,
    vehicle_type: vehicleType,
    disabled_warnings: [] as string[],
  } as NotificationThresholdRow

  for (const field of NUMERIC_THRESHOLD_FIELDS) {
    defaults[field] = 0
  }

  return defaults
}

const WRITABLE_THRESHOLD_FIELDS = new Set<string>(NUMERIC_THRESHOLD_FIELDS)

function buildWritablePayload(thresholds: Record<string, number | string[]>) {
  const payload: Record<string, number | string[]> = {}
  const ignoredColumns: string[] = []

  for (const [key, value] of Object.entries(thresholds)) {
    if (WRITABLE_THRESHOLD_FIELDS.has(key)) {
      const numeric = typeof value === "number" ? value : Number(value)
      payload[key] = Number.isFinite(numeric) ? numeric : 0
      continue
    }

    // 컬럼이 있는 회사만 저장되고, 없으면 아래 재시도에서 제거된다.
    if (key === "disabled_warnings" && Array.isArray(value)) {
      payload[key] = value
      continue
    }

    if (key === "id" || key === "company_code" || key === "vehicle_type" || key === "created_at" || key === "updated_at") {
      continue
    }

    ignoredColumns.push(key)
  }

  return { payload, ignoredColumns }
}

function extractMissingColumn(message: string) {
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column "([^"]+)" of relation/i,
    /column ([a-zA-Z0-9_]+) does not exist/i,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

function formatSaveError(
  error: { message?: string; code?: string; details?: string; hint?: string },
  context: {
    step: string
    companyCode: string
    vehicleType: string
    sentColumns: string[]
    ignoredColumns: string[]
    droppedColumns: string[]
  },
) {
  return [
    "저장에 실패했습니다.",
    `단계: ${context.step}`,
    `회사코드: ${context.companyCode}`,
    `차량종류: ${context.vehicleType}`,
    `코드: ${error.code || "-"}`,
    `메시지: ${error.message || "-"}`,
    error.details ? `상세: ${error.details}` : "",
    error.hint ? `힌트: ${error.hint}` : "",
    `전송 컬럼: ${context.sentColumns.join(", ") || "(없음)"}`,
    context.ignoredColumns.length > 0
      ? `DB에 없어 제외한 컬럼: ${context.ignoredColumns.join(", ")}`
      : "",
    context.droppedColumns.length > 0
      ? `재시도 중 제거한 컬럼: ${context.droppedColumns.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function getVehicleTypes(): Promise<string[]> {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      console.error("[v0] getVehicleTypes: 회사 코드가 없어 빈 배열을 반환합니다.")
      return []
    }

    const tableName = getTableName("vehicles", companyCode)
    const supabase = await createAdminClient()

    const { data, error } = await supabase.schema("drivermgm").from(tableName).select("vehicle_type")

    if (error) {
      console.error("[v0] Failed to fetch vehicle types:", error)
      return []
    }

    const uniqueTypes = new Set<string>()
    for (const row of data ?? []) {
      const rawType = row?.vehicle_type
      if (typeof rawType !== "string") continue

      const vehicleType = rawType.trim()
      if (!vehicleType) continue

      uniqueTypes.add(vehicleType)
    }

    return Array.from(uniqueTypes)
  } catch (error) {
    console.error("[v0] Error in getVehicleTypes:", error)
    return []
  }
}

export async function getNotificationThresholds(companyCodeParam?: string) {
  try {
    const companyCode = companyCodeParam || (await getCompanyCode())
    if (!companyCode) {
      console.error("[v0] getNotificationThresholds: 회사 코드가 없어 빈 배열을 반환합니다.")
      return []
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .schema("drivermgm")
      .from("notification_thresholds")
      .select("*")
      .eq("company_code", companyCode)
      .order("vehicle_type")

    if (error) {
      console.error("[v0] Failed to fetch notification thresholds:", error)
    }

    const rows = Array.isArray(data) ? data : []
    const existingTypes = new Set(
      rows
        .map((row) => (typeof row?.vehicle_type === "string" ? row.vehicle_type : ""))
        .filter((vehicleType) => vehicleType.length > 0),
    )

    // 목록 화면은 설정 객체가 있어야 상세로 이동한다.
    // 아직 행이 없는 차종도 0 기본값으로 채워 닭-달걀 문제를 막는다.
    const vehicleTypes = await getVehicleTypes()
    const defaults = vehicleTypes
      .filter((vehicleType) => !existingTypes.has(vehicleType))
      .map((vehicleType) => createDefaultThreshold(vehicleType, companyCode))

    return [...rows, ...defaults].sort((a, b) =>
      String(a.vehicle_type ?? "").localeCompare(String(b.vehicle_type ?? ""), "ko"),
    )
  } catch (error) {
    console.error("[v0] Error in getNotificationThresholds:", error)
    return []
  }
}

export async function getNotificationThresholdByType(vehicleType: string) {
  let companyCode: string | null = null

  try {
    companyCode = await getCompanyCode()
    if (!companyCode) {
      console.error("[v0] getNotificationThresholdByType: 회사 코드가 없습니다.")
      return null
    }

    const normalizedType = vehicleType.trim()
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .schema("drivermgm")
      .from("notification_thresholds")
      .select("*")
      .eq("company_code", companyCode)
      .eq("vehicle_type", normalizedType)
      .maybeSingle()

    if (error || !data) {
      if (error) {
        console.error("[v0] Failed to fetch notification threshold:", error)
      }
      return createDefaultThreshold(normalizedType, companyCode)
    }

    return data
  } catch (error) {
    console.error("[v0] Error in getNotificationThresholdByType:", error)
    if (companyCode) {
      return createDefaultThreshold(vehicleType.trim(), companyCode)
    }
    return null
  }
}

export async function updateNotificationThreshold(
  vehicleType: string,
  thresholds: Record<string, number | string[]>,
) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const normalizedType = vehicleType.trim()
    if (!normalizedType) {
      return { success: false, error: "차량 종류가 올바르지 않습니다." }
    }

    const supabase = await createAdminClient()
    const { payload, ignoredColumns } = buildWritablePayload(thresholds)
    const droppedColumns: string[] = []
    const now = new Date().toISOString()

    const writeRow = async (mode: "update" | "insert") => {
      const writable = {
        ...payload,
        updated_at: now,
      } as Record<string, number | string | string[]>

      for (let attempt = 0; attempt < 12; attempt += 1) {
        const query = supabase.schema("drivermgm").from("notification_thresholds")
        const result =
          mode === "update"
            ? await query
                .update(writable)
                .eq("company_code", companyCode)
                .eq("vehicle_type", normalizedType)
                .select("id")
            : await query
                .insert({
                  ...writable,
                  company_code: companyCode,
                  vehicle_type: normalizedType,
                })
                .select("id")

        if (!result.error) {
          return { ok: true as const, count: result.data?.length ?? 0 }
        }

        const missingColumn = extractMissingColumn(result.error.message || "")
        if (
          missingColumn &&
          missingColumn in writable &&
          missingColumn !== "company_code" &&
          missingColumn !== "vehicle_type"
        ) {
          delete writable[missingColumn]
          droppedColumns.push(missingColumn)
          continue
        }

        return { ok: false as const, error: result.error }
      }

      return {
        ok: false as const,
        error: { message: "없는 컬럼을 제거한 뒤에도 저장에 실패했습니다.", code: "RETRY_EXCEEDED" },
      }
    }

    const { data: existing, error: selectError } = await supabase
      .schema("drivermgm")
      .from("notification_thresholds")
      .select("id")
      .eq("company_code", companyCode)
      .eq("vehicle_type", normalizedType)

    if (selectError) {
      console.error("[v0] Failed to check notification threshold:", selectError)
      return {
        success: false,
        error: formatSaveError(selectError, {
          step: "기존 설정 조회",
          companyCode,
          vehicleType: normalizedType,
          sentColumns: Object.keys(payload),
          ignoredColumns,
          droppedColumns,
        }),
      }
    }

    if (existing && existing.length > 0) {
      const updated = await writeRow("update")
      if (!updated.ok) {
        console.error("[v0] Failed to update notification threshold:", updated.error)
        return {
          success: false,
          error: formatSaveError(updated.error, {
            step: "기존 설정 수정",
            companyCode,
            vehicleType: normalizedType,
            sentColumns: Object.keys(payload),
            ignoredColumns,
            droppedColumns,
          }),
        }
      }

      if (updated.count > 0) {
        return {
          success: true,
          warning: droppedColumns.length > 0 ? `DB에 없는 컬럼은 저장하지 않았습니다: ${droppedColumns.join(", ")}` : undefined,
        }
      }
    }

    const inserted = await writeRow("insert")
    if (!inserted.ok) {
      console.error("[v0] Failed to insert notification threshold:", inserted.error)
      return {
        success: false,
        error: formatSaveError(inserted.error, {
          step: "신규 설정 추가",
          companyCode,
          vehicleType: normalizedType,
          sentColumns: Object.keys(payload),
          ignoredColumns,
          droppedColumns,
        }),
      }
    }

    return {
      success: true,
      warning: droppedColumns.length > 0 ? `DB에 없는 컬럼은 저장하지 않았습니다: ${droppedColumns.join(", ")}` : undefined,
    }
  } catch (error) {
    console.error("[v0] Error in updateNotificationThreshold:", error)
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: `저장에 실패했습니다.\n메시지: ${message}` }
  }
}
