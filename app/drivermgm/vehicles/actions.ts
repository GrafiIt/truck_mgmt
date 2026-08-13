"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { verifyAdminCredentials as verifyAdmin } from "@/lib/vehicle-auth"
import { cookies } from "next/headers"

export const verifyAdminCredentials = verifyAdmin

/**
 * [공통] 쿠키에서 회사 코드(company_code) 추출 공통 함수
 * - next/headers의 cookies()를 사용하여 현재 접속한 사용자의 company_code 값을 읽어온다.
 * - 쿠키에 company_code가 없으면 null을 반환하고, 각 호출부에서 철저히 예외 처리한다.
 */
async function getCompanyCode(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const companyCodeCookie = cookieStore.get("company_code")

    if (!companyCodeCookie || !companyCodeCookie.value) {
      console.error("[v0] company_code 쿠키를 찾을 수 없습니다.")
      return null
    }

    return companyCodeCookie.value
  } catch (error) {
    console.error("[v0] company_code 쿠키 추출 중 오류:", error)
    return null
  }
}

/**
 * [공통] 회사별 동적 테이블/뷰 이름 생성기
 * - 멀티테넌트 아키텍처는 company_code 컬럼 필터링이 아니라
 *   회사별로 분리된 뷰/테이블(예: vehicles_human, vehicles_kukdong)로 격리한다.
 * - 모든 읽기/쓰기 연산은 이 함수가 만든 회사 전용 이름을 향한다.
 */
function getTableName(base: string, companyCode: string): string {
  return `${base}_${companyCode}`
}

/**
 * [조회] 회사 전용 뷰 vehicles_${companyCode}에서 차량 목록을 조회한다.
 */
export async function getVehicles(companyCodeParam?: string) {
  const MAX_RETRIES = 5

  // 파라미터 우선, 없으면 쿠키에서 회사 코드 추출
  const companyCode = companyCodeParam || (await getCompanyCode())
  if (!companyCode) {
    console.error("[v0] getVehicles: 회사 코드가 없어 빈 배열을 반환합니다.")
    return []
  }

  // 회사 전용 동적 이름 생성
  const tableName = getTableName("vehicles", companyCode)

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const supabase = await createAdminClient()

      if (!supabase || typeof supabase.from !== "function") {
        if (attempt < MAX_RETRIES) {
          const delay = 500 * Math.pow(2, attempt - 1)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        return []
      }

      const { data, error } = await supabase.schema("drivermgm").from(tableName).select("*").order("vehicle_number", { ascending: true })

      if (error) {
        console.error(`[v0] getVehicles: Database error on attempt ${attempt}:`, {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        if (attempt < MAX_RETRIES) {
          const delay = 500 * Math.pow(2, attempt - 1)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        return []
      }

      // vehicle_order 기준 오름차순 정렬 (null은 맨 뒤)
      if (data) {
        data.sort((a: any, b: any) => {
          const orderA = a.vehicle_order ?? Number.MAX_SAFE_INTEGER
          const orderB = b.vehicle_order ?? Number.MAX_SAFE_INTEGER
          return orderA - orderB
        })
      }

      return data || []
    } catch (error: any) {
      console.error(`[v0] getVehicles: Network/fetch error on attempt ${attempt}:`, {
        message: error?.message || String(error),
        stack: error?.stack,
        cause: error?.cause,
      })

      if (attempt < MAX_RETRIES) {
        const delay = 500 * Math.pow(2, attempt - 1)
        console.log(`[v0] getVehicles: Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      console.error("[v0] getVehicles: All retries exhausted")
      return []
    }
  }

  return []
}

/**
 * [조회] 회사 전용 뷰 vehicles_${companyCode}에서 차량번호로 단일 차량을 조회한다.
 */
export async function getVehicleByNumber(vehicleNumber: string) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      console.error("[v0] getVehicleByNumber: 회사 코드가 없습니다.")
      return null
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return null
    }

    const tableName = getTableName("vehicles", companyCode)
    const { data, error } = await supabase.schema("drivermgm").from(tableName).select("*").eq("vehicle_number", vehicleNumber).single()

    if (error) {
      console.error("[v0] Error fetching vehicle:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("[v0] Error in getVehicleByNumber:", error)
    return null
  }
}

/**
 * [조회] 회사 전용 뷰 vehicle_field_history_${companyCode} 및 inspection_history_${companyCode}
 * 에서 정비 이력을 조회한다.
 */
export async function getMaintenanceRecords(vehicleId: number) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      console.error("[v0] getMaintenanceRecords: 회사 코드가 없습니다.")
      return []
    }

    const supabase = await createAdminClient()

    // 회사 전용 동적 이름 생성
    const fieldHistoryTable = getTableName("vehicle_field_history", companyCode)
    const inspectionTable = getTableName("inspection_history", companyCode)

    const { data: fieldHistory, error: fieldError } = await supabase
      .schema("drivermgm")
      .from(fieldHistoryTable)
      .select("*")
      .eq("vehicle_id", vehicleId)
      .neq("field_name", "inspection") // 정기점검은 제외 (inspection_history에서만 조회)
      .order("maintenance_date", { ascending: false })

    if (fieldError) throw fieldError

    const { data: inspectionHistory, error: inspectionError } = await supabase
      .schema("drivermgm")
      .from(inspectionTable)
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false })

    if (inspectionError) throw inspectionError

    const fieldRecords =
      fieldHistory?.map((record) => {
        let fuel_amount = null
        let fuel_cost = null

        // 주유 항목인 경우 text_value와 cost에서 주유량과 금액을 추출
        if (record.field_name === "refueling") {
          // text_value에는 주유량(숫자), cost에는 주유비(원)가 저장됨
          fuel_amount = record.text_value ? Number.parseFloat(record.text_value) : null
          fuel_cost = record.cost || null
        }

        return {
          id: record.id,
          type: "field" as const,
          maintenance_date: record.maintenance_date,
          field_name: record.field_name,
          field_label: record.field_label,
          date_value: record.date_value,
          mileage_value: record.mileage_value,
          text_value: record.text_value,
          text_value2: record.text_value2,
          repair_shop: record.repair_shop,
          cost: record.cost,
          created_at: record.created_at,
          others_summary: record.field_name === "others" ? record.text_value : null,
          fuel_amount: fuel_amount,
          fuel_cost: fuel_cost,
          receipt_image_url: record.receipt_image_url || null,
        }
      }) || []

    const inspectionRecords =
      inspectionHistory?.map((record) => ({
        id: record.id,
        type: "inspection" as const,
        maintenance_date: record.maintenance_date,
        field_name: "inspection",
        field_label: "정기점검",
        date_value: record.inspection_date,
        mileage_value: null,
        text_value: record.inspection_name,
        text_value2: record.inspection_result, // inspection_result를 text_value2로 설정
        repair_shop: record.repair_shop,
        cost: record.cost,
        created_at: record.created_at,
        email_1: record.email_1,
        email_2: record.email_2,
        inspection_result: record.inspection_result,
        inspection_name: record.inspection_name,
        inspection_notes: record.inspection_notes,
        receipt_image_url: record.receipt_image_url || null,
      })) || []

    const allRecords = [...fieldRecords, ...inspectionRecords].sort((a, b) => {
      return new Date(b.maintenance_date).getTime() - new Date(a.maintenance_date).getTime()
    })

    return allRecords
  } catch (error) {
    console.error("[v0] Error in getMaintenanceRecords:", error)
    return []
  }
}

/**
 * [생성] 회사 전용 테이블 maintenance_records_${companyCode}에 정비 이력을 추가한다.
 */
export async function addMaintenanceRecord(formData: FormData) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    const vehicleId = Number.parseInt(formData.get("vehicle_id") as string)
    const maintenanceDate = formData.get("maintenance_date") as string
    const driverName = formData.get("driver_name") as string
    const mileage = Number.parseInt(formData.get("mileage") as string) || 0
    const description = formData.get("description") as string
    const repairShop = formData.get("repair_shop") as string
    const cost = Number.parseInt(formData.get("cost") as string) || 0
    const notes = formData.get("notes") as string

    // 회사 전용 동적 테이블에 삽입
    const tableName = getTableName("maintenance_records", companyCode)
    const { error } = await supabase.schema("drivermgm").from(tableName).insert({
      vehicle_id: vehicleId,
      maintenance_date: maintenanceDate,
      driver_name: driverName,
      mileage,
      description,
      repair_shop: repairShop,
      cost,
      notes,
    })

    if (error) {
      console.error("[v0] Error adding maintenance record:", error)
      return { success: false, error: "정비 이력 추가 중 오류가 발생했습니다." }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in addMaintenanceRecord:", error)
    return { success: false, error: "정비 이력 추가 중 오류가 발생했습니다." }
  }
}

/**
 * [수정] 회사 전용 테이블 vehicles_${companyCode}에서 차량 정보를 수정한다.
 */
export async function updateVehicle(vehicleNumber: string, updates: any) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    // 회사 전용 동적 테이블을 대상으로 수정 (차량번호로 식별)
    const tableName = getTableName("vehicles", companyCode)
    const { error } = await supabase
      .schema("drivermgm")
      .from(tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("vehicle_number", vehicleNumber)

    if (error) {
      console.error("[v0] Error updating vehicle:", error)
      return { success: false, error: "차량 정보 업데이트 중 오류가 발생했습니다." }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in updateVehicle:", error)
    return { success: false, error: "차량 정보 업데이트 중 오류가 발생했습니다." }
  }
}

/**
 * [생성] 회사 전용 테이블 vehicles_${companyCode}에 신규 차량을 등록한다.
 */
export async function createVehicle(formData: FormData) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    const vehicleData: any = {
      transporter: formData.get("transporter") as string,
      driver_name: formData.get("driver_name") as string,
      vehicle_number: formData.get("vehicle_number") as string,
      manufacturer: formData.get("manufacturer") as string,
      release_date: (formData.get("release_date") as string) || null,
      vehicle_age: formData.get("vehicle_age") ? Number.parseFloat(formData.get("vehicle_age") as string) : null,
      total_mileage: formData.get("total_mileage") ? Number.parseInt(formData.get("total_mileage") as string) : 0,
      last_inspection_date: (formData.get("last_inspection_date") as string) || null,
      inspection_result: (formData.get("inspection_result") as string) || null,
      fuel_efficiency: formData.get("fuel_efficiency")
        ? Number.parseFloat(formData.get("fuel_efficiency") as string)
        : null,
    }

    // 정비 항목 필드들 추가
    const maintenanceFields = [
      "grease",
      "engine_oil",
      "mission_oil",
      "diesel_filter",
      "defu_oil",
      "power_oil",
      "air_dryer",
      "dry_filter",
      "water_separator",
      "lining",
      "tire",
      "battery",
      "air_tank",
      "axle_bearing",
      "pto_joint",
      "pto_pump",
      "heater",
    ]

    for (const field of maintenanceFields) {
      const dateValue = formData.get(`${field}_date`) as string
      const mileageValue = formData.get(`${field}_mileage`) as string

      if (dateValue) {
        vehicleData[`${field}_date`] = dateValue
      }
      if (mileageValue) {
        vehicleData[`${field}_mileage`] = Number.parseInt(mileageValue)
      }
    }

    const vehicleType = (formData.get("vehicle_type") as string) || ""
    if (vehicleType) {
      vehicleData.vehicle_type = vehicleType
    }

    const tableName = getTableName("vehicles", companyCode)

    // 회사 전용 테이블에서 현재 회사의 최대 순번 조회
    try {
      const { data: maxRows } = await supabase
        .schema("drivermgm")
        .from(tableName)
        .select("vehicle_order")
        .order("vehicle_order", { ascending: false, nullsFirst: false })
        .limit(1)

      const maxOrder = maxRows?.[0]?.vehicle_order ?? 0
      vehicleData.vehicle_order = maxOrder + 1
    } catch (e) {
      // 순번 계산 실패 시 무시 (NULL로 저장됨)
    }

    // 회사 전용 테이블에 삽입
    const { error: insertError } = await supabase.schema("drivermgm").from(tableName).insert({
      ...vehicleData,
    })

    if (insertError) {
      console.error("[v0] Error creating vehicle:", insertError)
      return { success: false, error: "차량 등록 중 오류가 발생했습니다." }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in createVehicle:", error)
    return { success: false, error: "차량 등록 중 오류가 발생했습니다." }
  }
}

/**
 * [생성/수정] 회사 전용 테이블 vehicle_field_history_${companyCode}에 전월주행거리를 기록하고,
 * vehicles_${companyCode}의 전�������주행거리를 갱신한다.
 */
export async function addMonthlyMileageRecord(formData: FormData) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    const vehicleId = Number.parseInt(formData.get("vehicle_id") as string)
    const maintenanceDate = formData.get("maintenance_date") as string
    const mileageMonth = formData.get("mileage_month") as string // format: "2024-01"

    const monthStartMileageInput = formData.get("month_start_mileage")
    const monthEndMileageInput = formData.get("month_end_mileage")

    const monthStartMileage =
      monthStartMileageInput && monthStartMileageInput.toString().trim() !== ""
        ? Number.parseInt(monthStartMileageInput as string)
        : null
    const monthEndMileage =
      monthEndMileageInput && monthEndMileageInput.toString().trim() !== ""
        ? Number.parseInt(monthEndMileageInput as string)
        : null

    const dateValue = `${mileageMonth}-01`

    console.log("[v0] Adding monthly mileage record:", {
      vehicleId,
      maintenanceDate,
      mileageMonth,
      dateValue,
      monthStartMileage,
      monthEndMileage,
    })

    // 둘 다 입력된 경우에만 계산하고 차량 정보 업데이트
    let monthlyDistance = null
    const bothValuesProvided = monthStartMileage !== null && monthEndMileage !== null

    if (bothValuesProvided) {
      monthlyDistance = monthEndMileage - monthStartMileage
    }

    const receiptImageUrl = (formData.get("receipt_image_url") as string) || null

    // 프론트엔드(maintenance-history.tsx)가 목록/수정 화면에서 text_value를
    // { mileage_month, month_start_mileage, month_end_mileage } JSON으로 파싱하므로
    // 동일한 형식으로 저장해야 한다. (다른 프로그램의 add-monthly-mileage-record API와도 동일 형식)
    const monthlyMileageData = JSON.stringify({
      mileage_month: mileageMonth || null,
      month_start_mileage: monthStartMileage,
      month_end_mileage: monthEndMileage,
    })

    // field_label도 프론트엔드에서 넘어온 값("월간주행거리")을 그대로 사용한다.
    const fieldLabel = (formData.get("field_label") as string) || "월간주행거리"

    // 회사 전용 테이블(vehicle_field_history_${companyCode})에 삽입
    const fieldHistoryTable = getTableName("vehicle_field_history", companyCode)
    const { error: historyError } = await supabase.schema("drivermgm").from(fieldHistoryTable).insert({
      vehicle_id: vehicleId,
      maintenance_date: maintenanceDate,
      field_name: "monthly_mileage",
      field_label: fieldLabel,
      date_value: dateValue,
      mileage_value: monthlyDistance,
      text_value: monthlyMileageData,
      text_value2: null,
      receipt_image_url: receiptImageUrl,
    })

    if (historyError) {
      console.error("[v0] Error adding monthly mileage to history:", historyError)
      return { success: false, error: historyError.message }
    }

    // 둘 다 입력된 경우에만 차량 정보 업데이트
    if (bothValuesProvided && monthlyDistance !== null) {
      const vehiclesTable = getTableName("vehicles", companyCode)
      const { error: updateError } = await supabase
        .schema("drivermgm")
        .from(vehiclesTable)
        .update({
          previous_month_mileage: monthlyDistance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId)

      if (updateError) {
        console.error("[v0] Error updating vehicle:", updateError)
        return { success: false, error: updateError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in addMonthlyMileageRecord:", error)
    return { success: false, error: "전월주행거리 기록 추가 중 오류가 발생했습니다." }
  }
}

/**
 * [생성/수정] 회사 전용 테이블 vehicle_field_history_${companyCode}에 정비 이력을 추가하고,
 * vehicles_${companyCode}의 해당 항목을 갱신한다.
 */
export async function addVehicleFieldUpdate(formData: FormData) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    const vehicleId = Number.parseInt(formData.get("vehicle_id") as string)
    const maintenanceDate = formData.get("maintenance_date") as string
    const fieldName = formData.get("field_name") as string
    const fieldLabel = formData.get("field_label") as string
    const dateValue = (formData.get("date_value") as string) || null
    const mileageValue = formData.get("mileage_value") ? Number.parseInt(formData.get("mileage_value") as string) : null
    const textValue = (formData.get("text_value") as string) || null
    const repairShop = (formData.get("repair_shop") as string) || null
    const cost = formData.get("cost") ? Number.parseInt(formData.get("cost") as string) : null
    const maintenanceNotes = (formData.get("maintenance_notes") as string) || null
    const receiptImageUrl = (formData.get("receipt_image_url") as string) || null

    console.log("[v0] addVehicleFieldUpdate:", {
      vehicleId,
      fieldName,
      fieldLabel,
      dateValue,
      mileageValue,
      textValue,
      repairShop,
      cost,
      maintenanceNotes,
    })

    const updates: any = {}
    if (dateValue) {
      updates[`${fieldName}_date`] = dateValue
    }
    if (mileageValue !== null) {
      updates[`${fieldName}_mileage`] = mileageValue
    }
    if (fieldName === "others" && textValue) {
      updates.others_summary = textValue
    }

    if (Object.keys(updates).length > 0) {
      console.log("[v0] Updating vehicle with:", updates)

      // 회사 전용 테이블(vehicles_${companyCode}) 수정
      const vehiclesTable = getTableName("vehicles", companyCode)
      const { error: updateError } = await supabase
        .schema("drivermgm")
        .from(vehiclesTable)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId)

      if (updateError) {
        console.error("[v0] Error updating vehicle:", updateError)
        return { success: false, error: updateError.message }
      }
    }

    // 회사 전용 테이블(vehicle_field_history_${companyCode})에 삽입
    const fieldHistoryTable = getTableName("vehicle_field_history", companyCode)
    const { error: historyError } = await supabase.schema("drivermgm").from(fieldHistoryTable).insert({
      vehicle_id: vehicleId,
      maintenance_date: maintenanceDate,
      field_name: fieldName,
      field_label: fieldLabel,
      date_value: dateValue,
      mileage_value: mileageValue,
      text_value: textValue,
      text_value2: maintenanceNotes,
      repair_shop: repairShop,
      cost: cost,
      receipt_image_url: receiptImageUrl,
    })

    if (historyError) {
      console.error("[v0] Error adding field history:", historyError)
      return { success: false, error: historyError.message }
    }

    console.log("[v0] Successfully added vehicle field update")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in addVehicleFieldUpdate:", error)
    return { success: false, error: "정비 이력 추가 중 오류가 발생했습니다." }
  }
}

export async function saveMaintenance(formData: FormData) {
  return addVehicleFieldUpdate(formData)
}

/**
 * [삭제] 회사 전용 테이블 vehicles_${companyCode}에서 차량을 삭제한다.
 */
export async function deleteVehicle(vehicleNumber: string) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    // 회사 전용 테이블을 대상으로 삭제 (차량번호로 식별)
    const tableName = getTableName("vehicles", companyCode)
    const { error } = await supabase.schema("drivermgm").from(tableName).delete().eq("vehicle_number", vehicleNumber)

    if (error) {
      console.error("[v0] Error deleting vehicle:", error)
      return { success: false, error: "차량 삭제 중 오류가 발생했습니다." }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in deleteVehicle:", error)
    return { success: false, error: "차량 삭제 중 오류가 발생했습니다." }
  }
}

/**
 * [수정] 회사 전용 테이블 vehicles_${companyCode}의 기본 정보를 선별적으로 수정한다.
 */
export async function updateVehicleBasicInfo(vehicleNumber: string, updates: any) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    // 전달된 필드만 선별적으로 반영
    const updateData: any = { updated_at: new Date().toISOString() }

    if (updates.transporter !== undefined) updateData.transporter = updates.transporter || null
    if (updates.driver_name !== undefined) updateData.driver_name = updates.driver_name || null
    if (updates.manufacturer !== undefined) updateData.manufacturer = updates.manufacturer || null
    if (updates.release_date !== undefined) updateData.release_date = updates.release_date || null
    if (updates.last_inspection_date !== undefined)
      updateData.last_inspection_date = updates.last_inspection_date || null
    if (updates.total_mileage !== undefined)
      updateData.total_mileage =
        updates.total_mileage === null || updates.total_mileage === "" ? null : Number(updates.total_mileage)
    if (updates.vehicle_type !== undefined) updateData.vehicle_type = updates.vehicle_type || null
    if (updates.vehicle_order !== undefined)
      updateData.vehicle_order =
        updates.vehicle_order === null || updates.vehicle_order === "" ? null : Number(updates.vehicle_order)

    // 회사 전용 테이블(vehicles_${companyCode}) 수정
    const tableName = getTableName("vehicles", companyCode)
    const { error } = await supabase.schema("drivermgm").from(tableName).update(updateData).eq("vehicle_number", vehicleNumber)

    if (error) {
      console.error("[v0] Error updating vehicle basic info:", error)
      return { success: false, error: "차량 정보 수정 중 오류가 발생했습니다." }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in updateVehicleBasicInfo:", error)
    return { success: false, error: "차량 정보 수정 중 오류가 발생했습니다." }
  }
}

/**
 * [생성/수정] 회사 전용 테이블 refueling_history_${companyCode}에 주유 기록을 추가하고,
 * vehicles_${companyCode} 및 vehicle_field_history_${companyCode}를 갱신한다.
 */
export async function addRefuelingRecord(formData: FormData) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    const vehicleId = Number.parseInt(formData.get("vehicle_id") as string)
    const maintenanceDate = formData.get("maintenance_date") as string
    const refuelDate = formData.get("refuel_date") as string
    const mileage = Number.parseInt(formData.get("mileage") as string)
    const fuelAmount = Number.parseFloat(formData.get("fuel_amount") as string)
    const fuelCost = Number.parseInt(formData.get("fuel_cost") as string)
    const repairShop = (formData.get("repair_shop") as string) || null
    const maintenanceNotes = (formData.get("maintenance_notes") as string) || null
    const receiptImageUrl = (formData.get("receipt_image_url") as string) || null

    console.log("[v0] Adding refueling record:", {
      vehicleId,
      refuelDate,
      mileage,
      fuelAmount,
      fuelCost,
      repairShop,
      maintenanceNotes,
    })

    // 회사 전용 동적 이름 생성
    const refuelingTable = getTableName("refueling_history", companyCode)
    const vehiclesTable = getTableName("vehicles", companyCode)
    const fieldHistoryTable = getTableName("vehicle_field_history", companyCode)

    // 회사 전용 테이블(refueling_history_${companyCode})에 삽입
    const { error: refuelError } = await supabase.schema("drivermgm").from(refuelingTable).insert({
      vehicle_id: vehicleId,
      refuel_date: refuelDate,
      mileage,
      fuel_amount: fuelAmount,
      fuel_cost: fuelCost,
      maintenance_date: maintenanceDate,
      receipt_image_url: receiptImageUrl,
    })

    if (refuelError) {
      console.error("[v0] Error adding refueling record:", refuelError)
      return { success: false, error: refuelError.message }
    }

    // 회사 전용 테이블(vehicles_${companyCode})에서 현재 총주행거리 조회
    const { data: vehicle } = await supabase
      .schema("drivermgm")
      .from(vehiclesTable)
      .select("total_mileage")
      .eq("id", vehicleId)
      .single()

    const previousMileage = vehicle?.total_mileage ?? 0
    const distance = mileage - previousMileage
    const efficiency = distance > 0 && fuelAmount > 0 ? distance / fuelAmount : 0

    // 회사 전용 테이블(vehicles_${companyCode}) 수정
    const { error: updateError } = await supabase
      .schema("drivermgm")
      .from(vehiclesTable)
      .update({
        total_mileage: mileage,
        last_refuel_date: refuelDate,
        last_refuel_mileage: mileage,
        fuel_efficiency: efficiency,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId)

    if (updateError) {
      console.error("[v0] Error updating vehicle:", updateError)
      return { success: false, error: updateError.message }
    }

    // 회사 전용 테이블(vehicle_field_history_${companyCode})에 주유 이력 삽입
    const { error: historyError } = await supabase.schema("drivermgm").from(fieldHistoryTable).insert({
      vehicle_id: vehicleId,
      maintenance_date: maintenanceDate,
      field_name: "refueling",
      field_label: "주유",
      date_value: refuelDate,
      mileage_value: mileage,
      text_value: `${fuelAmount}L / ${fuelCost.toLocaleString()}원`,
      cost: fuelCost,
      repair_shop: repairShop,
      text_value2: maintenanceNotes,
      receipt_image_url: receiptImageUrl,
    })

    if (historyError) {
      console.error("[v0] Error adding refueling to history:", historyError)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in addRefuelingRecord:", error)
    return { success: false, error: "주유 기록 추가 중 오류가 발생했습니다." }
  }
}

/**
 * [조회] 회사 전�� 테이블 vehicles_${companyCode}에서 차량 순번 중복 여부를 확인한다.
 */
export async function checkVehicleOrderDuplicate(order: number, excludeVehicleNumber: string) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { isDuplicate: false, existingVehicleNumber: null }
    }

    const supabase = await createAdminClient()
    if (!supabase || typeof supabase.from !== "function") {
      return { isDuplicate: false, existingVehicleNumber: null }
    }

    // 회사 전용 테이블(vehicles_${companyCode}) 조회
    const tableName = getTableName("vehicles", companyCode)
    const { data } = await supabase
      .schema("drivermgm")
      .from(tableName)
      .select("vehicle_number")
      .eq("vehicle_order", Number(order))
      .neq("vehicle_number", excludeVehicleNumber)

    if (data && Array.isArray(data) && data.length > 0) {
      return { isDuplicate: true, existingVehicleNumber: data[0].vehicle_number as string }
    }
    return { isDuplicate: false, existingVehicleNumber: null }
  } catch (error) {
    return { isDuplicate: false, existingVehicleNumber: null }
  }
}

/**
 * [삭제] 회사 전용 이력 테이블에서 정비 이력을 삭제하고, vehicles_${companyCode}의 최종값을 동기화한다.
 */
export async function deleteMaintenanceRecord(recordId: string | number, recordType: string) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    // 회사 전용 동적 이름 생성
    const historyBase = recordType === "inspection" ? "inspection_history" : "vehicle_field_history"
    const historyTable = getTableName(historyBase, companyCode)
    const vehiclesTable = getTableName("vehicles", companyCode)

    // 먼저 레코드 정보를 가져옴 (vehicle_id와 field_name 필요)
    // inspection_history 테이블에는 field_name 컬럼이 없으므로 recordType에 따라 select 컬럼을 분기
    const selectColumns = recordType === "inspection" ? "id, vehicle_id" : "id, vehicle_id, field_name"
    const { data: existingRecord, error: selectError } = await supabase
      .schema("drivermgm")
      .from(historyTable)
      .select(selectColumns)
      .eq("id", recordId)
      .maybeSingle()

    if (selectError) {
      console.error("[v0] Error fetching record before delete:", selectError)
    }

    if (!existingRecord) {
      // 이미 삭제된 경우도 성공으로 처리
      return { success: true }
    }

    const vehicleId = (existingRecord as any).vehicle_id
    const fieldName = recordType === "inspection" ? "inspection" : ((existingRecord as any).field_name || recordType)

    // 회사 전용 이력 테이블에서 삭제
    const { error: deleteError } = await supabase.schema("drivermgm").from(historyTable).delete().eq("id", recordId)

    if (deleteError) {
      console.error("[v0] Error deleting record:", deleteError)
      return { success: false, error: "삭제 중 오류가 발생했습니다." }
    }

    // 차량 테이블의 최종 저장값 동기화 (삭제 후 남은 이력 중 최신값으로 업데이트)
    if (recordType === "inspection") {
      const inspectionTable = getTableName("inspection_history", companyCode)
      const { data: latestInspection } = await supabase
        .schema("drivermgm")
        .from(inspectionTable)
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("inspection_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      await supabase
        .schema("drivermgm")
        .from(vehiclesTable)
        .update({
          last_inspection_date: latestInspection?.inspection_date || null,
          inspection_name: latestInspection?.inspection_name || null,
          inspection_result: latestInspection?.inspection_result || null,
          inspection_notes: latestInspection?.inspection_notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId)
    } else if (fieldName !== "refueling" && fieldName !== "monthly_mileage" && fieldName !== "others") {
      // 일반 정비항목: 가장 최신 레코드로 차량 테이블 동기화
      const fieldHistoryTable = getTableName("vehicle_field_history", companyCode)
      const { data: latestRecord } = await supabase
        .schema("drivermgm")
        .from(fieldHistoryTable)
        .select("*")
        .eq("vehicle_id", vehicleId)
        .eq("field_name", fieldName)
        .order("date_value", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      await supabase
        .schema("drivermgm")
        .from(vehiclesTable)
        .update({
          [`${fieldName}_date`]: latestRecord?.date_value || null,
          [`${fieldName}_mileage`]: latestRecord?.mileage_value || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in deleteMaintenanceRecord:", error)
    return { success: false, error: "정비 이력 삭제 중 오류가 발생했습니다." }
  }
}

/**
 * [생성/수정] 회사 전용 테이블 inspection_history_${companyCode}에 정기검사 기록을 추가하고,
 * vehicles_${companyCode}의 검사 정보를 갱신한다.
 */
export async function addInspectionRecord(formData: FormData) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    const vehicleId = Number.parseInt(formData.get("vehicle_id") as string)
    const maintenanceDate = formData.get("maintenance_date") as string
    const inspectionDate = formData.get("inspection_date") as string
    const inspectionName = formData.get("inspection_name") as string
    const inspectionResult = (formData.get("inspection_result") as string) || "No"
    const inspectionNotes = (formData.get("inspection_notes") as string) || null
    const email1 = (formData.get("email_1") as string) || null
    const email2 = (formData.get("email_2") as string) || null
    const receiptImageUrl = (formData.get("receipt_image_url") as string) || null

    console.log("[v0] Adding inspection record:", {
      vehicleId,
      inspectionDate,
      inspectionName,
      inspectionResult,
      inspectionNotes,
      email1,
      email2,
    })

    // 회사 전용 동적 이름 생성
    const inspectionTable = getTableName("inspection_history", companyCode)
    const vehiclesTable = getTableName("vehicles", companyCode)

    // 회사 전용 테이블(inspection_history_${companyCode})에 삽입
    const { error: inspectionError } = await supabase.schema("drivermgm").from(inspectionTable).insert({
      vehicle_id: vehicleId,
      inspection_date: inspectionDate,
      inspection_name: inspectionName,
      inspection_result: inspectionResult,
      inspection_notes: inspectionNotes,
      maintenance_date: maintenanceDate,
      email_1: email1,
      email_2: email2,
      receipt_image_url: receiptImageUrl,
    })

    if (inspectionError) {
      console.error("[v0] Error adding inspection record:", inspectionError)
      return { success: false, error: inspectionError.message }
    }

    // 회사 전용 테이블(vehicles_${companyCode}) 수정
    const { error: updateError } = await supabase
      .schema("drivermgm")
      .from(vehiclesTable)
      .update({
        last_inspection_date: inspectionDate,
        inspection_name: inspectionName,
        inspection_result: inspectionResult,
        inspection_notes: inspectionNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId)

    if (updateError) {
      console.error("[v0] Error updating vehicle:", updateError)
      return { success: false, error: updateError.message }
    }

    // ��기��검은 inspection_history 테이블에만 저장 (vehicle_field_history에는 저장하지 않음)
    // 중복 저장을 방지하여 리스트에 2줄로 나타나지 않도록 함

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in addInspectionRecord:", error)
    return { success: false, error: "정기검사 기록 추가 중 오류가 발생했습니다." }
  }
}

/**
 * [수정] 회사 전용 이력 테이블에서 정비 이력 레코드를 수정하고, vehicles_${companyCode}의 최신 데이터를 동기화한다.
 * - field_name === "inspection" → inspection_history_${companyCode}
 * - 그 외 (refueling, monthly_mileage, others, 일반 정비항목) → vehicle_field_history_${companyCode}
 * - 수정 후 vehicles_${companyCode}의 최신 날짜/마일리지/점검 정보를 동기화한다.
 */
export async function updateMaintenanceRecord(payload: any) {
  try {
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    const { id, vehicle_id, field_name } = payload
    const vehiclesTable = getTableName("vehicles", companyCode)

    // ──────────────────────────────────────────────
    // 1. 정기점검 (inspection_history)
    // ──────────────────────────────────────────────
    if (field_name === "inspection") {
      const inspectionTable = getTableName("inspection_history", companyCode)

      const updateData: any = {}
      if (payload.date_value !== undefined) updateData.inspection_date = payload.date_value || null
      if (payload.maintenance_date !== undefined) updateData.maintenance_date = payload.maintenance_date || null
      if (payload.text_value !== undefined) updateData.inspection_name = payload.text_value || null
      if (payload.inspection_result !== undefined) updateData.inspection_result = payload.inspection_result || null
      if (payload.inspection_notes !== undefined) updateData.inspection_notes = payload.inspection_notes || null
      if (payload.email_1 !== undefined) updateData.email_1 = payload.email_1 || null
      if (payload.email_2 !== undefined) updateData.email_2 = payload.email_2 || null
      if (payload.repair_shop !== undefined) updateData.repair_shop = payload.repair_shop || null
      if (payload.cost !== undefined) updateData.cost = payload.cost ?? null
      if ("receipt_image_url" in payload) updateData.receipt_image_url = payload.receipt_image_url ?? null

      const { error: updateError } = await supabase
        .schema("drivermgm")
        .from(inspectionTable)
        .update(updateData)
        .eq("id", id)

      if (updateError) {
        console.error("[v0] Error updating inspection record:", updateError)
        return { success: false, error: updateError.message }
      }

      // vehicles 동기화: inspection_history에서 가장 최신 레코드로 업데이트
      const { data: latestInspection } = await supabase
        .schema("drivermgm")
        .from(inspectionTable)
        .select("*")
        .eq("vehicle_id", vehicle_id)
        .order("inspection_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      await supabase
        .schema("drivermgm")
        .from(vehiclesTable)
        .update({
          last_inspection_date: latestInspection?.inspection_date || null,
          inspection_name: latestInspection?.inspection_name || null,
          inspection_result: latestInspection?.inspection_result || null,
          inspection_notes: latestInspection?.inspection_notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicle_id)

      return { success: true }
    }

    // ──────────────────────────────────────────────
    // 2. 주유 / 일반 정비항목 (vehicle_field_history)
    // ──────────────────────────────────────────────
    const fieldHistoryTable = getTableName("vehicle_field_history", companyCode)

    const updateData: any = {}
    if (payload.maintenance_date !== undefined) updateData.maintenance_date = payload.maintenance_date || null
    if (payload.date_value !== undefined) updateData.date_value = payload.date_value || null
    if (payload.mileage_value !== undefined) updateData.mileage_value = payload.mileage_value ?? null
    if (payload.repair_shop !== undefined) updateData.repair_shop = payload.repair_shop || null
    if (payload.cost !== undefined) updateData.cost = payload.cost ?? null
    if (payload.text_value !== undefined) updateData.text_value = payload.text_value || null
    if (payload.text_value2 !== undefined) updateData.text_value2 = payload.text_value2 || null
    if ("receipt_image_url" in payload) updateData.receipt_image_url = payload.receipt_image_url ?? null

    // 주유 전용: text_value에 "주유량L / 주유비원" 형식으로 반영
    if (field_name === "refueling") {
      const fuelAmount = payload.fuel_amount ?? null
      const fuelCost = payload.fuel_cost ?? null
      if (fuelAmount !== null || fuelCost !== null) {
        updateData.text_value = `${fuelAmount ?? 0}L / ${(fuelCost ?? 0).toLocaleString()}원`
      }
      if (fuelCost !== null) {
        updateData.cost = fuelCost
      }
    }

    // 기타 항목: others_summary → text_value
    if (field_name === "others" && payload.others_summary !== undefined) {
      updateData.text_value = payload.others_summary || null
    }

    const { error: updateError } = await supabase
      .schema("drivermgm")
      .from(fieldHistoryTable)
      .update(updateData)
      .eq("id", id)

    if (updateError) {
      console.error("[v0] Error updating field history record:", updateError)
      return { success: false, error: updateError.message }
    }

    // vehicles 동기화: 일반 정비항목(refueling, monthly_mileage, others 제외)만
    if (field_name !== "refueling" && field_name !== "monthly_mileage" && field_name !== "others") {
      const { data: latestRecord } = await supabase
        .schema("drivermgm")
        .from(fieldHistoryTable)
        .select("*")
        .eq("vehicle_id", vehicle_id)
        .eq("field_name", field_name)
        .order("date_value", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      await supabase
        .schema("drivermgm")
        .from(vehiclesTable)
        .update({
          [`${field_name}_date`]: latestRecord?.date_value || null,
          [`${field_name}_mileage`]: latestRecord?.mileage_value || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicle_id)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in updateMaintenanceRecord:", error)
    return { success: false, error: "정비 이력 수정 중 오류가 발생했습니다." }
  }
}
