import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getTableNameFromRequest } from "@/lib/table-utils"

export const dynamic = "force-dynamic"

// 차량 테이블의 정비 항목 최종값을 업데이트하는 헬퍼 함수
async function updateVehicleLatestMaintenanceValue(
  supabase: any,
  vehiclesTable: string,
  fieldHistoryTable: string,
  vehicleId: number,
  fieldName: string
) {
  console.log("[v0] Updating vehicle latest value for field:", fieldName, "vehicleId:", vehicleId)

  // 주유, 월간주행거리, 기타 항목은 vehicles 테이블에 별도 컬럼이 없거나 특수 처리 필요
  if (fieldName === "refueling" || fieldName === "monthly_mileage" || fieldName === "others" || fieldName === "inspection") {
    console.log("[v0] Field", fieldName, "does not require vehicle table update in save API")
    return
  }

  // 일반 정비항목: vehicle_field_history에서 가장 최신 레코드 조회
  // date_value(정비실행일) 기준으로 가장 최신 레코드를 가져옴
  const { data: latestRecord } = await supabase
    .from(fieldHistoryTable)
    .select("*")
    .eq("vehicle_id", vehicleId)
    .eq("field_name", fieldName)
    .order("date_value", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  console.log("[v0] Latest record for field", fieldName, ":", latestRecord)

  // 차량 테이블의 해당 필드 업데이트
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }
  
  // 정비 항목별 날짜/주행거리 컬럼명 매핑
  updates[`${fieldName}_date`] = latestRecord?.date_value || null
  updates[`${fieldName}_mileage`] = latestRecord?.mileage_value || null

  console.log("[v0] Updating vehicle with:", updates)

  const { error: updateError } = await supabase
    .from(vehiclesTable)
    .update(updates)
    .eq("id", vehicleId)

  if (updateError) {
    console.error("[v0] Error updating vehicle field:", updateError)
  } else {
    console.log("[v0] Vehicle", fieldName, "values updated successfully")
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const vehicleId = formData.get("vehicle_id") as string
    const fieldName = formData.get("field_name") as string
    const fieldLabel = formData.get("field_label") as string
    const maintenanceDate = formData.get("maintenance_date") as string
    const dateValue = formData.get("date_value") as string
    const mileageValue = formData.get("mileage_value") as string
    const textValue = formData.get("text_value") as string
    const repairShop = formData.get("repair_shop") as string
    const cost = formData.get("cost") as string
    const maintenanceNotes = formData.get("maintenance_notes") as string

    console.log("[v0] Saving maintenance record:", {
      vehicleId,
      fieldName,
      fieldLabel,
    })

    if (!vehicleId || !fieldName) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // 1. vehicle_field_history에 기록 저장
    const tableName = await getTableNameFromRequest(request, "vehicle_field_history")
    const { error } = await supabase.from(tableName).insert({
      vehicle_id: parseInt(vehicleId),
      field_name: fieldName,
      field_label: fieldLabel,
      maintenance_date: maintenanceDate,
      date_value: dateValue,
      mileage_value: mileageValue ? parseInt(mileageValue) : null,
      text_value: textValue,
      repair_shop: repairShop,
      cost: cost ? parseInt(cost) : null,
      text_value2: maintenanceNotes,
    })

    if (error) {
      console.error("[v0] Error saving maintenance record:", error)
      return NextResponse.json(
        { success: false, error: "정비 기록 저장 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    // 2. vehicles 테이블의 최종 저장값 업데이트
    const vehiclesTable = await getTableNameFromRequest(request, "vehicles")
    await updateVehicleLatestMaintenanceValue(
      supabase,
      vehiclesTable,
      tableName,
      parseInt(vehicleId),
      fieldName
    )

    console.log("[v0] Maintenance record saved successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
