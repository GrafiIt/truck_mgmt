import { NextRequest, NextResponse } from "next/server"
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
  fieldName: string,
  request: NextRequest
) {
  console.log("[v0] Updating vehicle latest value for field:", fieldName, "vehicleId:", vehicleId)

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

    console.log("[v0] Latest inspection record:", latestInspection)

    // 차량 테이블 업데이트
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
      console.error("[v0] Error updating vehicle inspection:", updateError)
    } else {
      console.log("[v0] Vehicle inspection values updated successfully")
    }
  } else if (fieldName === "refueling" || fieldName === "monthly_mileage" || fieldName === "others") {
    // 주유, 월간주행거리, 기타 항목은 vehicles 테이블에 별도 컬럼이 없거나 특수 처리 필요
    // refueling의 경우 연비 재계산이 필요할 수 있지만, 복잡도를 고려하여 최종값 동기화만 처리
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      vehicle_id,
      field_name,
      date_value,
      maintenance_date,
      repair_shop,
      cost,
      text_value,
      text_value2,
      inspection_result,
      inspection_notes,
      email_1,
      email_2,
      mileage_value,
      fuel_amount,
      fuel_cost,
      others_summary,
      mileage_month,
      month_start_mileage,
      month_end_mileage,
    } = body

    console.log("[v0] Updating maintenance record:", { id, field_name })

    if (!id || !vehicle_id) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()
    
    // 테이블 이름 조회
    const vehiclesTable = await getTableNameFromRequest(request, "vehicles")
    const fieldHistoryTable = await getTableNameFromRequest(request, "vehicle_field_history")
    const inspectionTable = await getTableNameFromRequest(request, "inspection_history")

    // inspection 타입의 경우 inspection_history 테이블만 업데이트
    if (field_name === "inspection") {
      const inspectionTable = await getTableNameFromRequest(request, "inspection_history")
      const { error: inspectionError } = await supabase
        .from(inspectionTable)
        .update({
          inspection_date: date_value || null, // 정비실행일 (inspection_date 컬럼 사용)
          maintenance_date: maintenance_date || date_value, // 입력일자
          inspection_name: text_value,
          inspection_result: inspection_result,
          inspection_notes: inspection_notes || null,
          email_1: email_1 || null,
          email_2: email_2 || null,
          repair_shop: repair_shop || null,
          cost: cost || null,
        })
        .eq("id", id)

      if (inspectionError) {
        console.error("[v0] Error updating inspection_history:", inspectionError)
        return NextResponse.json(
          { success: false, error: "정기점검 정보 업데이트 중 오류가 발생했습니다." },
          { status: 500 }
        )
      }
    } else {
      // 다른 정비항목의 경우 vehicle_field_history 테이블 업데이트
      const updateData: Record<string, any> = {
        date_value: date_value || null, // 정비실행일
        maintenance_date: maintenance_date || date_value, // 입력일자
      }

      if (field_name === "refueling") {
        // 주유 기록: text_value에는 주유량 저장, cost에는 주유비 저장, mileage_value에는 주행거리 저장
        updateData.text_value = fuel_amount != null ? String(fuel_amount) : (text_value || null) // 주유량 (L)
        updateData.cost = fuel_cost != null ? fuel_cost : (cost || null) // 주유비 (원)
        updateData.repair_shop = repair_shop || null // 주유소명
        updateData.text_value2 = text_value2 || null // 정비 기타 사항
        updateData.mileage_value = mileage_value || null // 주행거리 (km)
      } else if (field_name === "others") {
        // 기타 항목: mileage_value + others_summary
        updateData.text_value = others_summary || text_value || null // 한줄요약
        updateData.text_value2 = text_value2 || null // 정비 기타 사항
        updateData.repair_shop = repair_shop || null
        updateData.cost = cost || null
        updateData.mileage_value = mileage_value || null // 주행거리 (km)
      } else if (field_name === "monthly_mileage") {
        // 월간주행거리: text_value에 JSON, mileage_value에 계산된 월간거리
        updateData.text_value = text_value || null // JSON string
        updateData.mileage_value = mileage_value || null // 계산된 월간거리
        // date_value를 주행월의 첫날로 설정
        if (mileage_month) {
          updateData.date_value = `${mileage_month}-01`
        }
      } else {
        // date / both 타입 공통: 정비실행일, 수리업체, 금액, 정비 기타 사항
        updateData.text_value = text_value || null
        updateData.text_value2 = text_value2 || null
        updateData.repair_shop = repair_shop || null
        updateData.cost = cost || null
        // "both" type은 mileage_value도 저장
        if (mileage_value != null) {
          updateData.mileage_value = mileage_value
        }
      }

      console.log("[v0] Updating vehicle_field_history with data:", {
        id,
        field_name,
        updateData,
      })

      const fieldHistoryTable = await getTableNameFromRequest(request, "vehicle_field_history")
      const { error } = await supabase
        .from(fieldHistoryTable)
        .update(updateData)
        .eq("id", id)

      if (error) {
        console.error("[v0] Error updating maintenance record:", error)
        return NextResponse.json(
          { success: false, error: "정비이력 업데이트 중 오류가 발생했습니다." },
          { status: 500 }
        )
      }
    }

    console.log("[v0] Maintenance record updated successfully")
    
    // 차량 테이블의 최종 저장값 동기화
    await updateVehicleLatestMaintenanceValue(
      supabase,
      vehiclesTable,
      fieldHistoryTable,
      inspectionTable,
      vehicle_id,
      field_name,
      request
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
