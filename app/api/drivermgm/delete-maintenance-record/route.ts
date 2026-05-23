import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getTableNameFromRequest } from "@/lib/table-utils"

export const dynamic = "force-dynamic"

// 차량 테이블의 정비 항목 최종값을 업데이트하는 헬퍼 함수
async function updateVehicleLatestMaintenanceValue(
  supabase: any,
  vehiclesTable: string,
  fieldHistoryTable: string,
  inspectionTable: string,
  vehicleId: number,
  fieldName: string
) {
  console.log("[v0] Updating vehicle latest value after delete for field:", fieldName, "vehicleId:", vehicleId)

  if (fieldName === "inspection") {
    // 정기점검: inspection_history에서 가장 최신 레코드 조회
    const { data: latestInspection } = await supabase
      .from(inspectionTable)
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("inspection_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log("[v0] Latest inspection record after delete:", latestInspection)

    // 차량 테이블 업데이트 (레코드가 없으면 null로 초기화)
    const { error: updateError } = await supabase
      .from(vehiclesTable)
      .update({
        last_inspection_date: latestInspection?.inspection_date || null,
        inspection_name: latestInspection?.inspection_name || null,
        inspection_result: latestInspection?.inspection_result || null,
        inspection_notes: latestInspection?.inspection_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId)

    if (updateError) {
      console.error("[v0] Error updating vehicle inspection after delete:", updateError)
    } else {
      console.log("[v0] Vehicle inspection values updated successfully after delete")
    }
  } else if (fieldName === "refueling" || fieldName === "monthly_mileage" || fieldName === "others") {
    // 주유, 월간주행거리, 기타 항목은 vehicles 테이블에 별도 컬럼이 없거나 특수 처리 필요
    console.log("[v0] Field", fieldName, "does not require vehicle table update")
  } else {
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

    console.log("[v0] Latest record for field", fieldName, "after delete:", latestRecord)

    // 차량 테이블의 해당 필드 업데이트 (레코드가 없으면 null로 초기화)
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    
    // 정비 항목별 날짜/주행거리 컬럼명 매핑
    updates[`${fieldName}_date`] = latestRecord?.date_value || null
    updates[`${fieldName}_mileage`] = latestRecord?.mileage_value || null

    console.log("[v0] Updating vehicle after delete with:", updates)

    const { error: updateError } = await supabase
      .from(vehiclesTable)
      .update(updates)
      .eq("id", vehicleId)

    if (updateError) {
      console.error("[v0] Error updating vehicle field after delete:", updateError)
    } else {
      console.log("[v0] Vehicle", fieldName, "values updated successfully after delete")
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const recordId = formData.get("recordId") as string
    const recordType = formData.get("recordType") as string

    console.log("[v0] Delete request received:", { recordId, recordType })

    if (!recordId) {
      return NextResponse.json({ success: false, error: "레코드 ID가 누락되었습니다." }, { status: 400 })
    }

    const supabase = await createAdminClient()
    
    // 테이블 이름 조회
    const vehiclesTable = await getTableNameFromRequest(request, "vehicles")
    const fieldHistoryTable = await getTableNameFromRequest(request, "vehicle_field_history")
    const inspectionTable = await getTableNameFromRequest(request, "inspection_history")

    // Delete the maintenance record
    // 정기점검만 inspection_history 테이블에 저장되고, 나머지는 모두 vehicle_field_history에 저장됨
    const schemaTableName = recordType === "inspection" 
      ? inspectionTable
      : fieldHistoryTable
    
    // 먼저 레코드 정보를 가져옴 (vehicle_id와 field_name 필요)
    const { data: existingRecord } = await supabase
      .from(schemaTableName)
      .select("id, vehicle_id, field_name")
      .eq("id", recordId)
      .maybeSingle()
    
    if (!existingRecord) {
      console.log("[v0] Record not found or already deleted:", recordId, "in table:", schemaTableName)
      // 이미 삭제된 경우도 성공으로 처리 (UI 새로고침을 위해)
      return NextResponse.json({ success: true, message: "이미 삭제된 레코드입니다." })
    }

    const vehicleId = existingRecord.vehicle_id
    // inspection_history 테이블에는 field_name 컬럼이 없으므로 recordType을 사용
    const fieldName = recordType === "inspection" ? "inspection" : (existingRecord.field_name || recordType)

    console.log("[v0] Record to delete - vehicleId:", vehicleId, "fieldName:", fieldName)

    // 삭제 실행
    console.log("[v0] Deleting from", schemaTableName, "table, recordId:", recordId)
    const { error: deleteError } = await supabase
      .from(schemaTableName)
      .delete()
      .eq("id", recordId)

    if (deleteError) {
      console.error("[v0] Error deleting record:", deleteError)
      return NextResponse.json({ success: false, error: "삭제 중 오류가 발생했습니다." }, { status: 500 })
    }

    console.log("[v0] Successfully deleted maintenance record:", recordId, "from", schemaTableName)
    
    // 차량 테이블의 최종 저장값 동기화 (삭제 후 남은 이력 중 최신값으로 업데이트)
    await updateVehicleLatestMaintenanceValue(
      supabase,
      vehiclesTable,
      fieldHistoryTable,
      inspectionTable,
      vehicleId,
      fieldName
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in delete-maintenance-record:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
