"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getTableName } from "@/lib/table-utils"
import { verifyAdminCredentials as verifyAdmin } from "@/lib/vehicle-auth"

export const verifyAdminCredentials = verifyAdmin

export async function getVehicles(companyCodeParam?: string) {
  const MAX_RETRIES = 5

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

      // 파라미터로 전달된 companyCode 사용, 없으면 쿠키에서 가져오기
      let tableName: string
      if (companyCodeParam) {
        tableName = `vehicles_${companyCodeParam}`
      } else {
        tableName = await getTableName("vehicles")
      }
      
      const { data, error } = await supabase.from(tableName).select("*").order("vehicle_number", { ascending: true })

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

      // vehicle_type을 각 차량별로 가져오기 (PostgREST 스키마 캐시 우회)
      if (data && data.length > 0) {
        try {
          const vehicleNumbers = data.map(v => `'${v.vehicle_number.replace(/'/g, "''")}'`).join(',')
          const { data: typeData } = await supabase.rpc('query_sql', {
            sql_query: `SELECT vehicle_number, vehicle_type FROM drivermgm.${tableName} WHERE vehicle_number IN (${vehicleNumbers})`
          })
          
          if (typeData && Array.isArray(typeData)) {
            const typeMap = new Map(typeData.map((item: any) => [item.vehicle_number, item.vehicle_type]))
            data.forEach((vehicle: any) => {
              vehicle.vehicle_type = typeMap.get(vehicle.vehicle_number) || null
            })
          }
        } catch (e) {
          console.error("[v0] getVehicles: Failed to fetch vehicle_type data", e)
        }
      }

      // previous_month_mileage는 이제 트리거로 vehicles 테이블에 직접 저장됨
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

export async function getVehicleByNumber(vehicleNumber: string) {
  try {
    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return null
    }

    const tableName = await getTableName("vehicles")
    const { data, error } = await supabase.from(tableName).select("*").eq("vehicle_number", vehicleNumber).single()

    if (error) {
      console.error("[v0] Error fetching vehicle:", error)
      return null
    }

    // vehicle_type을 직접 SQL로 가져오기 (PostgREST 스키마 캐시 우회)
    if (data) {
      try {
        const { data: sqlResult } = await supabase.rpc('query_sql', {
          sql_query: `SELECT vehicle_type FROM drivermgm.${tableName} WHERE vehicle_number = '${vehicleNumber.replace(/'/g, "''")}'`
        })
        if (sqlResult && Array.isArray(sqlResult) && sqlResult.length > 0) {
          data.vehicle_type = sqlResult[0].vehicle_type
        }
      } catch (e) {
        // vehicle_type 조회 실패 시 무시
      }
    }

    return data
  } catch (error) {
    console.error("[v0] Error in getVehicleByNumber:", error)
    return null
  }
}

export async function getMaintenanceRecords(vehicleId: number) {
  try {
    const supabase = await createAdminClient()

    const fieldHistoryTable = await getTableName("vehicle_field_history")
    const inspectionTable = await getTableName("inspection_history")

    const { data: fieldHistory, error: fieldError } = await supabase
      .from(fieldHistoryTable)
      .select("*")
      .eq("vehicle_id", vehicleId)
      .neq("field_name", "inspection") // 정기점검은 제외 (inspection_history에서만 조회)
      .order("maintenance_date", { ascending: false })

    if (fieldError) throw fieldError

    const { data: inspectionHistory, error: inspectionError } = await supabase
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

export async function addMaintenanceRecord(formData: FormData) {
  try {
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

    const maintenanceTable = await getTableName("maintenance_records")
    const { error } = await supabase.from(maintenanceTable).insert({
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

export async function updateVehicle(vehicleNumber: string, updates: any) {
  try {
    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    const tableName = await getTableName("vehicles")
    const { error } = await supabase
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

export async function createVehicle(formData: FormData) {
  try {
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
      release_date: formData.get("release_date") as string,
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

    // vehicle_type은 PostgREST 캐시 이슈로 별도 처리
    const vehicleType = (formData.get("vehicle_type") as string) || ""

    const tableName = await getTableName("vehicles")

    // PostgREST를 우회하여 exec_sql로 직접 INSERT (스키마 캐시 문제 방지)
    const columns = Object.keys(vehicleData)
    const values = columns.map((col) => {
      const val = vehicleData[col]
      if (val === null || val === undefined || val === "") return "NULL"
      if (typeof val === "number") return String(val)
      return `'${String(val).replace(/'/g, "''")}'`
    })

    // vehicle_type 컬럼/값 추가
    if (vehicleType) {
      columns.push("vehicle_type")
      values.push(`'${vehicleType.replace(/'/g, "''")}'`)
    }

    const insertSQL = `INSERT INTO drivermgm.${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")})`

    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql_query: insertSQL
    })

    if (insertError) {
      console.error("[v0] Error creating vehicle via exec_sql:", insertError)
      return { success: false, error: "차량 등록 중 오류가 발생했습니다." }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in createVehicle:", error)
    return { success: false, error: "차량 등록 중 오류가 발생했습니다." }
  }
}

export async function addMonthlyMileageRecord(formData: FormData) {
  try {
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

    // 정비 이력에 기록 (항상 저장)
    const fieldHistoryTable = await getTableName("vehicle_field_history")
    const { error: historyError } = await supabase.from(fieldHistoryTable).insert({
      vehicle_id: vehicleId,
      maintenance_date: maintenanceDate,
      field_name: "monthly_mileage",
      field_label: "전월주행거리",
      date_value: dateValue,
      mileage_value: monthlyDistance,
      text_value: monthStartMileage !== null ? monthStartMileage.toString() : null,
      text_value2: monthEndMileage !== null ? monthEndMileage.toString() : null,
    })

    if (historyError) {
      console.error("[v0] Error adding monthly mileage to history:", historyError)
      return { success: false, error: historyError.message }
    }

    // 둘 다 입력된 경우에만 차량 정보 업데이트
    if (bothValuesProvided && monthlyDistance !== null) {
      const vehiclesTable = await getTableName("vehicles")
      const { error: updateError } = await supabase
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
    return { success: false, error: "전월주행거리 �������록 추가 중 오류가 발생했습니다." }
  }
}

export async function addVehicleFieldUpdate(formData: FormData) {
  try {
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

      const vehiclesTable = await getTableName("vehicles")
      const { error: updateError } = await supabase
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

    const fieldHistoryTable = await getTableName("vehicle_field_history")
    const { error: historyError } = await supabase.from(fieldHistoryTable).insert({
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

export async function deleteVehicle(vehicleNumber: string) {
  try {
    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    const tableName = await getTableName("vehicles")
    const { error } = await supabase.from(tableName).delete().eq("vehicle_number", vehicleNumber)

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

export async function updateVehicleBasicInfo(vehicleNumber: string, updates: any) {
  try {
    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.from !== "function") {
      console.error("[v0] Invalid Supabase client returned")
      return { success: false, error: "데이터베이스 연결 오류" }
    }

    const tableName = await getTableName("vehicles")
    
    // exec_sql을 사용하여 직접 SQL로 업데이트 (PostgREST 스키마 캐시 우회)
    const setClauses: string[] = [`updated_at = '${new Date().toISOString()}'`]

    const dateFields = ["release_date", "last_inspection_date"]

    const formatSqlValue = (key: string, val: any): string => {
      if (val === null || val === undefined || val === "") return "NULL"
      if (typeof val === "number") return String(val)
      return `'${String(val).replace(/'/g, "''")}'`
    }
    
    if (updates.transporter !== undefined) setClauses.push(`transporter = ${formatSqlValue("transporter", updates.transporter)}`)
    if (updates.driver_name !== undefined) setClauses.push(`driver_name = ${formatSqlValue("driver_name", updates.driver_name)}`)
    if (updates.manufacturer !== undefined) setClauses.push(`manufacturer = ${formatSqlValue("manufacturer", updates.manufacturer)}`)
    if (updates.release_date !== undefined) setClauses.push(`release_date = ${formatSqlValue("release_date", updates.release_date)}`)
    if (updates.last_inspection_date !== undefined) setClauses.push(`last_inspection_date = ${formatSqlValue("last_inspection_date", updates.last_inspection_date)}`)
    if (updates.total_mileage !== undefined) setClauses.push(`total_mileage = ${formatSqlValue("total_mileage", updates.total_mileage)}`)
    if (updates.vehicle_type !== undefined) setClauses.push(`vehicle_type = ${formatSqlValue("vehicle_type", updates.vehicle_type)}`)

    const updateSQL = `UPDATE drivermgm.${tableName} SET ${setClauses.join(", ")} WHERE vehicle_number = '${vehicleNumber.replace(/'/g, "''")}'`

    const { error } = await supabase.rpc('exec_sql', {
      sql_query: updateSQL
    })

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

export async function addRefuelingRecord(formData: FormData) {
  try {
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

    const refuelingTable = await getTableName("refueling_history")
    const { error: refuelError } = await supabase.from(refuelingTable).insert({
      vehicle_id: vehicleId,
      refuel_date: refuelDate,
      mileage,
      fuel_amount: fuelAmount,
      fuel_cost: fuelCost,
      maintenance_date: maintenanceDate,
    })

    if (refuelError) {
      console.error("[v0] Error adding refueling record:", refuelError)
      return { success: false, error: refuelError.message }
    }

    const vehiclesTable = await getTableName("vehicles")
    const { data: vehicle } = await supabase.from(vehiclesTable).select("total_mileage").eq("id", vehicleId).single()

    const previousMileage = vehicle?.total_mileage ?? 0
    const distance = mileage - previousMileage
    const efficiency = distance > 0 && fuelAmount > 0 ? distance / fuelAmount : 0

    const { error: updateError } = await supabase
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

    const { error: historyError } = await supabase.from('"drivermgm"."vehicle_field_history"').insert({
      vehicle_id: vehicleId,
      maintenance_date: maintenanceDate,
      field_name: "refueling",
      field_label: "주유",
      date_value: refuelDate,
      mileage_value: mileage,
      text_value: `${fuelAmount}L / ${fuelCost.toLocaleString()}원`,
      repair_shop: repairShop,
      text_value2: maintenanceNotes,
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

export async function addInspectionRecord(formData: FormData) {
  try {
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

    const inspectionTable = await getTableName("inspection_history")
    const { error: inspectionError } = await supabase.from(inspectionTable).insert({
      vehicle_id: vehicleId,
      inspection_date: inspectionDate,
      inspection_name: inspectionName,
      inspection_result: inspectionResult,
      inspection_notes: inspectionNotes,
      maintenance_date: maintenanceDate,
      email_1: email1,
      email_2: email2,
    })

    if (inspectionError) {
      console.error("[v0] Error adding inspection record:", inspectionError)
      return { success: false, error: inspectionError.message }
    }

    const vehiclesTable = await getTableName("vehicles")
    const { error: updateError } = await supabase
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

    // 정기점검은 inspection_history 테이블에만 저장 (vehicle_field_history에는 저장하지 않음)
    // 중복 저장을 방지하여 리스트에 2줄로 나타나지 않도록 함

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in addInspectionRecord:", error)
    return { success: false, error: "정기검사 기록 추가 중 오류가 발생했습니다." }
  }
}
