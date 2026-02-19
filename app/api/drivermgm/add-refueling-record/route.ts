import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getTableNameFromRequest } from "@/lib/table-utils"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const vehicleId = formData.get("vehicle_id") as string
    const maintenanceDate = formData.get("maintenance_date") as string
    const refuelDate = formData.get("refuel_date") as string
    const mileage = formData.get("mileage") as string
    const fuelAmount = formData.get("fuel_amount") as string
    const fuelCost = formData.get("fuel_cost") as string
    const repairShop = formData.get("repair_shop") as string
    const maintenanceNotes = formData.get("maintenance_notes") as string

    

    if (!vehicleId || !refuelDate) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // 동적 테이블 이름 사용
    const tableName = await getTableNameFromRequest(request, "vehicle_field_history")

    // insert 데이터 - 다른 API들과 일관된 방식으로 수정
    const { error } = await supabase.from(tableName).insert({
      vehicle_id: parseInt(vehicleId),
      maintenance_date: maintenanceDate || refuelDate,
      field_name: "refueling",
      field_label: "주유",
      date_value: refuelDate,
      mileage_value: parseInt(mileage) || 0,
      text_value: fuelAmount,
      text_value2: maintenanceNotes || null,
      cost: parseInt(fuelCost) || 0,
      repair_shop: repairShop || null,
    })

    if (error) {
      console.error("Error adding refueling record:", error)
      return NextResponse.json(
        { success: false, error: "주유 기록 추가 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    // 주유 기록의 주행거리를 vehicles 테이블의 total_mileage에 반영
    // NOTE: 현재 direct update에 문제가 있어 주석 처리함.
    // 이후 database trigger로 자동화할 예정
    /*
    if (mileage) {
      const vehiclesTableName = await getTableNameFromRequest(request, "vehicles")
      const mileageValue = parseInt(mileage)
      
      console.log("[v0] Updating total_mileage to:", mileageValue)
      
      const { error: updateError } = await supabase
        .from(vehiclesTableName)
        .update({
          total_mileage: mileageValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parseInt(vehicleId))
      
      if (updateError) {
        console.error("[v0] Error updating total_mileage:", updateError)
      } else {
        console.log("[v0] total_mileage updated successfully")
      }
    }
    */

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
