"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { verifyAdminCredentials as verifyAdmin } from "@/lib/vehicle-auth"
import { cookies } from "next/headers"

export const verifyAdminCredentials = verifyAdmin

/**
 * [요구사항 1] 쿠키에서 회사 코드(company_code) 추출 공통 함수
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
 * [요구사항 2] 조회(GET) - 동적 View 타겟
 * public.vehicles_${companyCode} 뷰에서 차량 목록을 조회한다.
 */
export async function getVehicles(companyCodeParam?: string) {
  const MAX_RETRIES = 5

  // [요구사항 1] 파라미터 우선, 없으면 쿠키에서 회사 코드 추출
  const companyCode = companyCodeParam || (await getCompanyCode())
  if (!companyCode) {
    console.error("[v0] getVehicles: 회사 코드가 없어 빈 배열을 반환합니다.")
    return []
  }

  // [요구사항 2] 동적 View 이름 생성 (public 스키마의 회사 전용 뷰)
  const viewName = `vehicles_${companyCode}`

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

      const { data, error } = await supabase.from(viewName).select("*").order("vehicle_number", { ascending: true })

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
 * [요구사항 2] 조회(GET) - 동적 View 타겟
 * public.vehicles_${companyCode} 뷰에서 차량번호로 단일 차량을 조회한다.
 */
export async function getVehicleByNumber(vehicleNumber: string) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
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

    // [요구사항 2] 동적 View 이름 생성
    const viewName = `vehicles_${companyCode}`
    const { data, error } = await supabase.from(viewName).select("*").eq("vehicle_number", vehicleNumber).single()

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
 * [요구사항 2] 조회(GET) - 동적 View 타겟
 * public.vehicle_field_history_${companyCode} 및 public.inspection_history_${companyCode}
 * 뷰에서 정비 이력을 조회한다.
 */
export async function getMaintenanceRecords(vehicleId: number) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      console.error("[v0] getMaintenanceRecords: 회사 코드가 없습니다.")
      return []
    }

    const supabase = await createAdminClient()

    // [요구사항 2] 동적 View 이름 생성
    const fieldHistoryView = `vehicle_field_history_${companyCode}`
    const inspectionView = `inspection_history_${companyCode}`

    const { data: fieldHistory, error: fieldError } = await supabase
      .from(fieldHistoryView)
      .select("*")
      .eq("vehicle_id", vehicleId)
      .neq("field_name", "inspection") // 정기점검은 제외 (inspection_history에서만 조회)
      .order("maintenance_date", { ascending: false })

    if (fieldError) throw fieldError

    const { data: inspectionHistory, error: inspectionError } = await supabase
      .from(inspectionView)
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
 * [요구사항 3] 생성(Write) - 원본 테이블 타겟 + company_code 방어
 */
export async function addMaintenanceRecord(formData: FormData) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
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

    // [요구사항 3] 원본 테이블(drivermgm.maintenance_records)에 직접 삽입 + company_code
    const { error } = await supabase
      .schema("drivermgm")
      .from("maintenance_records")
      .insert({
        vehicle_id: vehicleId,
        maintenance_date: maintenanceDate,
        driver_name: driverName,
        mileage,
        description,
        repair_shop: repairShop,
        cost,
        notes,
        company_code: companyCode,
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
 * [요구사항 3] 수정(Write) - 원본 테이블 타겟 + company_code 방어
 */
export async function updateVehicle(vehicleNumber: string, updates: any) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    // [요구사항 3] 원본 테이블(drivermgm.vehicles)을 대상으로 수정 + company_code 필터링
    const { error } = await supabase
      .schema("drivermgm")
      .from("vehicles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("vehicle_number", vehicleNumber)
      .eq("company_code", companyCode)

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
 * [요구사항 3] 생성(Write) - 원본 테이블 타겟 + company_code 방어
 */
export async function createVehicle(formData: FormData) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
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

    // [요구사항 3] 원본 테이블(drivermgm.vehicles)에서 현재 회사의 최대 순번 조회 + company_code 필터
    try {
      const { data: maxRows } = await supabase
        .schema("drivermgm")
        .from("vehicles")
        .select("vehicle_order")
        .eq("company_code", companyCode)
        .order("vehicle_order", { ascending: false, nullsFirst: false })
        .limit(1)

      const maxOrder = maxRows?.[0]?.vehicle_order ?? 0
      vehicleData.vehicle_order = maxOrder + 1
    } catch (e) {
      // 순번 계산 실패 시 무시 (NULL로 저장됨)
    }

    // [요구사항 3] 원본 테이블(drivermgm.vehicles)에 직접 삽입 + company_code
    const { error: insertError } = await supabase
      .schema("drivermgm")
      .from("vehicles")
      .insert({
        ...vehicleData,
        company_code: companyCode,
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
 * [요구사항 3] 생성/수정(Write) - 원본 테이블 타겟 + company_code 방어
 */
export async function addMonthlyMileageRecord(formData: FormData) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
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

    // [요구사항 3] 원본 테이블(drivermgm.vehicle_field_history)에 직접 삽입 + company_code
    const { error: historyError } = await supabase
      .schema("drivermgm")
      .from("vehicle_field_history")
      .insert({
        vehicle_id: vehicleId,
        maintenance_date: maintenanceDate,
        field_name: "monthly_mileage",
        field_label: "전월주행거리",
        date_value: dateValue,
        mileage_value: monthlyDistance,
        text_value: monthStartMileage !== null ? monthStartMileage.toString() : null,
        text_value2: monthEndMileage !== null ? monthEndMileage.toString() : null,
        company_code: companyCode,
      })

    if (historyError) {
      console.error("[v0] Error adding monthly mileage to history:", historyError)
      return { success: false, error: historyError.message }
    }

    // 둘 다 입력된 경우에만 차량 정보 업데이트
    if (bothValuesProvided && monthlyDistance !== null) {
      // [요구사항 3] 원본 테이블(drivermgm.vehicles) 수정 + company_code 필터링
      const { error: updateError } = await supabase
        .schema("drivermgm")
        .from("vehicles")
        .update({
          previous_month_mileage: monthlyDistance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId)
        .eq("company_code", companyCode)

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
 * [요구사항 3] 생성/수정(Write) - 원본 테이블 타겟 + company_code 방어
 */
export async function addVehicleFieldUpdate(formData: FormData) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
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

      // [요구사항 3] 원본 테이블(drivermgm.vehicles) 수정 + company_code 필터링
      const { error: updateError } = await supabase
        .schema("drivermgm")
        .from("vehicles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId)
        .eq("company_code", companyCode)

      if (updateError) {
        console.error("[v0] Error updating vehicle:", updateError)
        return { success: false, error: updateError.message }
      }
    }

    // [요구사항 3] 원본 테이블(drivermgm.vehicle_field_history)에 직접 삽입 + company_code
    const { error: historyError } = await supabase
      .schema("drivermgm")
      .from("vehicle_field_history")
      .insert({
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
        company_code: companyCode,
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
 * [요구사항 3] 삭제(Write) - 원본 테이블 타겟 + company_code 방어
 */
export async function deleteVehicle(vehicleNumber: string) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    // [요구사항 3] 원본 테이블(drivermgm.vehicles)을 대상으로 삭제 + company_code 필터링
    const { error } = await supabase
      .schema("drivermgm")
      .from("vehicles")
      .delete()
      .eq("vehicle_number", vehicleNumber)
      .eq("company_code", companyCode)

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
 * [요구사항 3] 수정(Write) - 원본 테이블 타겟 + company_code 방어
 */
export async function updateVehicleBasicInfo(vehicleNumber: string, updates: any) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
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

    // [요구사항 3] 원본 테이블(drivermgm.vehicles) 수정 + company_code 필터링
    const { error } = await supabase
      .schema("drivermgm")
      .from("vehicles")
      .update(updateData)
      .eq("vehicle_number", vehicleNumber)
      .eq("company_code", companyCode)

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
 * [요구사항 3] 생성/수정(Write) - 원본 테이블 타겟 + company_code 방어
 * (기존 버그: 정비이력을 회사 접미사 없는 공유 테이블에 저장하던 부분을 원본 테이블 + company_code로 교정)
 */
export async function addRefuelingRecord(formData: FormData) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
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

    console.log("[v0] Adding refueling record:", {
      vehicleId,
      refuelDate,
      mileage,
      fuelAmount,
      fuelCost,
      repairShop,
      maintenanceNotes,
    })

    // [요구사항 3] 원본 테이블(drivermgm.refueling_history)에 직접 삽입 + company_code
    const { error: refuelError } = await supabase
      .schema("drivermgm")
      .from("refueling_history")
      .insert({
        vehicle_id: vehicleId,
        refuel_date: refuelDate,
        mileage,
        fuel_amount: fuelAmount,
        fuel_cost: fuelCost,
        maintenance_date: maintenanceDate,
        company_code: companyCode,
      })

    if (refuelError) {
      console.error("[v0] Error adding refueling record:", refuelError)
      return { success: false, error: refuelError.message }
    }

    // [요구사항 3] 원본 테이블(drivermgm.vehicles)에서 현재 총주행거리 조회 + company_code 필터링
    const { data: vehicle } = await supabase
      .schema("drivermgm")
      .from("vehicles")
      .select("total_mileage")
      .eq("id", vehicleId)
      .eq("company_code", companyCode)
      .single()

    const previousMileage = vehicle?.total_mileage ?? 0
    const distance = mileage - previousMileage
    const efficiency = distance > 0 && fuelAmount > 0 ? distance / fuelAmount : 0

    // [요구사항 3] 원본 테이블(drivermgm.vehicles) 수정 + company_code 필터링
    const { error: updateError } = await supabase
      .schema("drivermgm")
      .from("vehicles")
      .update({
        total_mileage: mileage,
        last_refuel_date: refuelDate,
        last_refuel_mileage: mileage,
        fuel_efficiency: efficiency,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId)
      .eq("company_code", companyCode)

    if (updateError) {
      console.error("[v0] Error updating vehicle:", updateError)
      return { success: false, error: updateError.message }
    }

    // [버그 교정 + 요구사항 3] 원본 테이블(drivermgm.vehicle_field_history)에 직접 삽입 + company_code
    // (기존에는 회사 접미사 없는 공유 테이블에 저장되어 특정 차량만 이력이 노출되던 원인)
    const { error: historyError } = await supabase
      .schema("drivermgm")
      .from("vehicle_field_history")
      .insert({
        vehicle_id: vehicleId,
        maintenance_date: maintenanceDate,
        field_name: "refueling",
        field_label: "주유",
        date_value: refuelDate,
        mileage_value: mileage,
        text_value: `${fuelAmount}L / ${fuelCost.toLocaleString()}원`,
        repair_shop: repairShop,
        text_value2: maintenanceNotes,
        company_code: companyCode,
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
 * [요구사항 3] 조회(Write 컨텍스트의 중복 검증) - 원본 테이블 타겟 + company_code 방어
 */
export async function checkVehicleOrderDuplicate(order: number, excludeVehicleNumber: string) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { isDuplicate: false, existingVehicleNumber: null }
    }

    const supabase = await createAdminClient()
    if (!supabase || typeof supabase.from !== "function") {
      return { isDuplicate: false, existingVehicleNumber: null }
    }

    // [요구사항 3] 원본 테이블(drivermgm.vehicles) 조회 + company_code 필터링
    const { data } = await supabase
      .schema("drivermgm")
      .from("vehicles")
      .select("vehicle_number")
      .eq("vehicle_order", Number(order))
      .eq("company_code", companyCode)
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
 * [요구사항 3] 삭제(Write) - 원본 테이블 타겟 + company_code 방어
 */
export async function deleteMaintenanceRecord(recordId: string | number, recordType: string) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
    const companyCode = await getCompanyCode()
    if (!companyCode) {
      return { success: false, error: "회사 코드를 찾을 수 없습니다. 다시 로그인해주세요." }
    }

    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    // [요구사항 3] 원본 테이블 대상 (drivermgm 스키마)
    const historyBaseTable = recordType === "inspection" ? "inspection_history" : "vehicle_field_history"

    // 먼저 레코드 정보를 가져옴 (vehicle_id와 field_name 필요)
    // inspection_history 테이블에는 field_name 컬럼이 없으므로 recordType에 따라 select 컬럼을 분기
    const selectColumns = recordType === "inspection" ? "id, vehicle_id" : "id, vehicle_id, field_name"
    const { data: existingRecord, error: selectError } = await supabase
      .schema("drivermgm")
      .from(historyBaseTable)
      .select(selectColumns)
      .eq("id", recordId)
      .eq("company_code", companyCode)
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

    // [요구사항 3] 원본 테이블 삭제 + company_code 필터링
    const { error: deleteError } = await supabase
      .schema("drivermgm")
      .from(historyBaseTable)
      .delete()
      .eq("id", recordId)
      .eq("company_code", companyCode)

    if (deleteError) {
      console.error("[v0] Error deleting record:", deleteError)
      return { success: false, error: "삭제 중 오류가 발생했습니다." }
    }

    // 차량 테이블의 최종 저장값 동기화 (삭제 후 남은 이력 중 최신값으로 업데이트)
    if (recordType === "inspection") {
      // [요구사항 3] 원본 테이블 조회 + company_code 필터링
      const { data: latestInspection } = await supabase
        .schema("drivermgm")
        .from("inspection_history")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .eq("company_code", companyCode)
        .order("inspection_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      // [요구사항 3] 원본 테이블 수정 + company_code 필터링
      await supabase
        .schema("drivermgm")
        .from("vehicles")
        .update({
          last_inspection_date: latestInspection?.inspection_date || null,
          inspection_name: latestInspection?.inspection_name || null,
          inspection_result: latestInspection?.inspection_result || null,
          inspection_notes: latestInspection?.inspection_notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId)
        .eq("company_code", companyCode)
    } else if (fieldName !== "refueling" && fieldName !== "monthly_mileage" && fieldName !== "others") {
      // 일반 정비항목: 가장 최신 레코드로 차량 테이블 동기화
      // [요구사항 3] 원본 테이블 조회 + company_code 필터링
      const { data: latestRecord } = await supabase
        .schema("drivermgm")
        .from("vehicle_field_history")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .eq("field_name", fieldName)
        .eq("company_code", companyCode)
        .order("date_value", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      // [요구사항 3] 원본 테이블 수정 + company_code 필터링
      await supabase
        .schema("drivermgm")
        .from("vehicles")
        .update({
          [`${fieldName}_date`]: latestRecord?.date_value || null,
          [`${fieldName}_mileage`]: latestRecord?.mileage_value || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicleId)
        .eq("company_code", companyCode)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in deleteMaintenanceRecord:", error)
    return { success: false, error: "정비 이력 삭제 중 오류가 발생했습니다." }
  }
}

/**
 * [요구사항 3] 생성/수정(Write) - 원본 테이블 타겟 + company_code 방어
 */
export async function addInspectionRecord(formData: FormData) {
  try {
    // [요구사항 1] 쿠키에서 회사 코드 추출
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

    console.log("[v0] Adding inspection record:", {
      vehicleId,
      inspectionDate,
      inspectionName,
      inspectionResult,
      inspectionNotes,
      email1,
      email2,
    })

    // [요구사항 3] 원본 테이블(drivermgm.inspection_history)에 직접 삽입 + company_code
    const { error: inspectionError } = await supabase
      .schema("drivermgm")
      .from("inspection_history")
      .insert({
        vehicle_id: vehicleId,
        inspection_date: inspectionDate,
        inspection_name: inspectionName,
        inspection_result: inspectionResult,
        inspection_notes: inspectionNotes,
        maintenance_date: maintenanceDate,
        email_1: email1,
        email_2: email2,
        company_code: companyCode,
      })

    if (inspectionError) {
      console.error("[v0] Error adding inspection record:", inspectionError)
      return { success: false, error: inspectionError.message }
    }

    // [요구사항 3] 원본 테이블(drivermgm.vehicles) 수정 + company_code 필터링
    const { error: updateError } = await supabase
      .schema("drivermgm")
      .from("vehicles")
      .update({
        last_inspection_date: inspectionDate,
        inspection_name: inspectionName,
        inspection_result: inspectionResult,
        inspection_notes: inspectionNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId)
      .eq("company_code", companyCode)

    if (updateError) {
      console.error("[v0] Error updating vehicle:", updateError)
      return { success: false, error: updateError.message }
    }

    // 정기점검은 inspection_history 테이블에만 저장 (vehicle_field_history에는 저장하지 않음)
    // 중복 저장을 방지하여 리스트에 2줄로 나타나지 않도록 함

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in addInspectionRecord:", error)
    return { success: false, error: "정기검사 기록 추가 중 오류가 발생했습니다." }
  }
}
