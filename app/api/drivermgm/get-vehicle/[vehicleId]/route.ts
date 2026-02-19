import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getTableNameFromRequest } from "@/lib/table-utils"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ vehicleId: string }> }) {
  try {
    const { vehicleId } = await params
    
    
    
    const supabase = await createAdminClient()
    
    // 동적 테이블 이름 사용 (await 추가)
    const tableName = await getTableNameFromRequest(request, "vehicles")
    
    const { data: vehicle, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", parseInt(vehicleId))
      .single()
    
    if (error || !vehicle) {
      console.error("Error fetching vehicle:", error)
      return NextResponse.json(
        { success: false, error: "차량 정보를 조회할 수 없습니다." },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, vehicle })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
