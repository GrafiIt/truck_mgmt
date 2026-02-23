import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getTableNameFromRequest } from "@/lib/table-utils"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("[v0] ========== REFUELING API ROUTE ENTERED ==========")
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

    console.log("[v0] === REFUELING RECORD API CALLED ===")
    console.log("[v0] Refueling record data received:", {
      vehicleId,
      refuelDate,
      mileage,
      fuelAmount,
      fuelCost
    })

    if (!vehicleId || !refuelDate) {
      console.log("[v0] ERROR: Missing required fields")
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // 동적 테이블 이름 사용
    const tableName = await getTableNameFromRequest(request, "vehicle_field_history")
    const vehiclesTableName = await getTableNameFromRequest(request, "vehicles")

    // 주유 기록을 저장하기 전에 현재 총주행거리를 먼저 조회 (이것이 "이전 주행거리")
    const { data: vehicleBeforeUpdate } = await supabase
      .from(vehiclesTableName)
      .select("total_mileage")
      .eq("id", parseInt(vehicleId))
      .single()
    
    const previousTotalMileage = vehicleBeforeUpdate?.total_mileage ?? 0

    // insert 데이터
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
      console.error("[v0] ERROR adding refueling record:", error)
      return NextResponse.json(
        { success: false, error: "주유 기록 추가 중 오류가 발생했습니다." },
        { status: 500 }
      )
    }
    
    console.log("[v0] Refueling record saved successfully to", tableName)

    // 연비 계산 및 차량 정보 업데이트
    let calculationDebug = { skipped: false, reason: "", previousMileage: 0, currentMileage: 0, distance: 0, fuelAmountValue: 0, efficiency: 0 }
    
    if (mileage && fuelAmount) {
      console.log("[v0] Calculating fuel efficiency...")
      
      // 이전 주행거리 = 주유 기록 저장 전의 vehicles.total_mileage
      const previousMileage = previousTotalMileage
      
      const currentMileage = parseInt(mileage)
      const fuelAmountValue = parseFloat(fuelAmount)
      const distance = currentMileage - previousMileage
      const efficiency = distance > 0 && fuelAmountValue > 0 ? distance / fuelAmountValue : 0
      
      calculationDebug = { skipped: false, reason: "", previousMileage, currentMileage, distance, fuelAmountValue, efficiency }
      
      console.log("[v0] Fuel efficiency calculation:", calculationDebug)
      
      // 차량 정보 업데이트
      const { error: updateError } = await supabase
        .from(vehiclesTableName)
        .update({
          total_mileage: currentMileage,
          last_refuel_date: refuelDate,
          last_refuel_mileage: currentMileage,
          fuel_efficiency: efficiency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parseInt(vehicleId))
      
      if (updateError) {
        console.error("[v0] ERROR updating vehicle fuel efficiency:", updateError)
      } else {
        console.log("[v0] SUCCESS: Vehicle fuel efficiency updated to", efficiency, "km/L")
        console.log("[v0] SUCCESS: Total mileage updated to", currentMileage, "km")
      }
    } else {
      calculationDebug = { 
        skipped: true, 
        reason: `Missing: mileage=${mileage}, fuelAmount=${fuelAmount}`,
        previousMileage: 0,
        currentMileage: 0,
        distance: 0,
        fuelAmountValue: 0,
        efficiency: 0
      }
      console.log("[v0] WARNING: Skipping fuel efficiency calculation - missing mileage or fuelAmount")
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

    console.log("[v0] === REFUELING RECORD API COMPLETED SUCCESSFULLY ===")
    
    // 디버깅을 위한 정보 포함
    const { data: updatedVehicle } = await supabase
      .from(vehiclesTableName)
      .select("fuel_efficiency, total_mileage")
      .eq("id", parseInt(vehicleId))
      .single()
    
    return NextResponse.json({ 
      success: true,
      debug: {
        fuelEfficiency: updatedVehicle?.fuel_efficiency,
        totalMileage: updatedVehicle?.total_mileage,
        calculation: calculationDebug,
        message: "연비 계산 완료"
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
