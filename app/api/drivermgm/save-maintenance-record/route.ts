import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getTableNameFromRequest } from "@/lib/table-utils"

export const dynamic = "force-dynamic"

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

    // 2. vehicles 테이블의 최종 저장값 업데이트는 스킵
    // (차량 정보는 vehicle_field_history에만 저장)
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
