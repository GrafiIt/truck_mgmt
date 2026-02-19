import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getTableNameFromRequest } from "@/lib/table-utils"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const vehicleId = formData.get("vehicle_id") as string
    const maintenanceDate = formData.get("maintenance_date") as string
    const inspectionDate = formData.get("inspection_date") as string
    const inspectionName = formData.get("inspection_name") as string
    const inspectionResult = formData.get("inspection_result") as string
    const inspectionNotes = formData.get("maintenance_notes") as string
    const email1 = formData.get("email_1") as string
    const email2 = formData.get("email_2") as string
    const repairShop = formData.get("repair_shop") as string
    const costStr = formData.get("cost") as string
    const cost = costStr ? parseInt(costStr, 10) : null

    console.log("[v0] Adding inspection record:", {
      vehicleId,
      inspectionDate,
      inspectionName,
      inspectionResult,
      repairShop,
      cost,
    })

    if (!vehicleId || !inspectionDate) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // inspection_history 테이블에만 저장 (vehicle_field_history에는 저장하지 않음)
    const tableName = await getTableNameFromRequest(request, "inspection_history")
    const { error: inspectionError } = await supabase.from(tableName).insert({
      vehicle_id: parseInt(vehicleId),
      maintenance_date: maintenanceDate,
      inspection_date: inspectionDate,
      inspection_name: inspectionName,
      inspection_result: inspectionResult,
      inspection_notes: inspectionNotes,
      email_1: email1,
      email_2: email2,
      repair_shop: repairShop || null,
      cost: cost,
    })

    if (inspectionError) {
      console.error("[v0] Error adding inspection record:", inspectionError)
      return NextResponse.json(
        { success: false, error: "정기점검 기록 추가 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }

    console.log("[v0] Inspection record added successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
