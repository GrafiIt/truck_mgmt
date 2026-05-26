"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getTableName } from "@/lib/table-utils"

export interface VehicleStat {
  vehicle_number: string
  period_mileage: number
  total_fuel_cost: number
  total_fuel_amount: number
  total_maintenance_cost: number
  fuel_efficiency: number
}

export async function getVehicleStatistics(companyCode: string, startDate: string, endDate: string): Promise<VehicleStat[]> {
  try {
    const supabase = await createAdminClient()

    if (!supabase || typeof supabase.rpc !== "function") {
      console.error("[v0] getVehicleStatistics: Supabase client not initialized properly")
      return []
    }

    if (!companyCode) {
      console.error("[v0] getVehicleStatistics: companyCode is required")
      return []
    }

    const { data, error } = await supabase.rpc("get_vehicle_statistics", {
      p_company_code: companyCode,
      p_start_date: startDate,
      p_end_date: endDate,
    })

    if (error) {
      console.error("[v0] getVehicleStatistics: RPC error:", {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] getVehicleStatistics: Unexpected error:", err)
    return []
  }
}
