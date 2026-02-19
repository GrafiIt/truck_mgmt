import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getTableNameFromRequest } from "@/lib/table-utils"

export const dynamic = "force-dynamic"

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

    // Delete the maintenance record
    // 정기점검만 inspection_history 테이블에 저장되고, 나머지는 모두 vehicle_field_history에 저장됨
    const schemaTableName = recordType === "inspection" 
      ? await getTableNameFromRequest(request, "inspection_history")
      : await getTableNameFromRequest(request, "vehicle_field_history")
    
    // 먼저 레코드가 존재하는지 확인 (maybeSingle은 결과가 없어도 에러를 발생시키지 않음)
    const { data: existingRecord } = await supabase
      .from(schemaTableName)
      .select("id")
      .eq("id", recordId)
      .maybeSingle()
    
    if (!existingRecord) {
      console.log("[v0] Record not found or already deleted:", recordId, "in table:", schemaTableName)
      // 이미 삭제된 경우도 성공으로 처리 (UI 새로고침을 위해)
      return NextResponse.json({ success: true, message: "이미 삭제된 레코드입니다." })
    }

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
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in delete-maintenance-record:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
