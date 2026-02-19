import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { getTableNameFromRequest } from "@/lib/table-utils"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const vehicleId = formData.get("vehicle_id") as string
    const maintenanceDate = formData.get("maintenance_date") as string
    const mileageMonth = formData.get("mileage_month") as string
    const monthStartMileage = formData.get("month_start_mileage") as string
    const monthEndMileage = formData.get("month_end_mileage") as string
    const monthlyDistance = formData.get("monthly_distance") as string

    console.log("[v0] Adding monthly mileage record:", {
      vehicleId,
      maintenanceDate,
      mileageMonth,
      monthStartMileage,
      monthEndMileage,
      monthlyDistance,
    })

    if (!vehicleId || !monthStartMileage || !monthEndMileage || !monthlyDistance) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    const tableName = await getTableNameFromRequest(request, "vehicle_field_history")
    
    // 주행월을 날짜로 변환 (YYYY-MM → YYYY-MM-01)
    const mileageMonthDate = mileageMonth ? `${mileageMonth}-01` : null
    
    // month_start_mileage와 month_end_mileage를 JSON으로 text_value에 저장
    const monthlyMileageData = JSON.stringify({
      month_start_mileage: parseInt(monthStartMileage),
      month_end_mileage: parseInt(monthEndMileage),
      mileage_month: mileageMonth,
    })
    
    const { error } = await supabase.from(tableName).insert({
      vehicle_id: parseInt(vehicleId),
      maintenance_date: maintenanceDate,
      field_name: "monthly_mileage",
      field_label: "월간 주행거리",
      date_value: mileageMonthDate,
      text_value: monthlyMileageData,
      mileage_value: parseInt(monthlyDistance),
    })

    if (error) {
      console.error("[v0] Error adding monthly mileage record:", error)
      return NextResponse.json(
        { success: false, error: "월간 주행거리 기록 추가 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    console.log("[v0] Monthly mileage record added successfully")
    
    // vehicles 페이지 캐시 갱신 (전월 주행거리 업데이트를 위해)
    revalidatePath("/drivermgm/vehicles", "page")
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
