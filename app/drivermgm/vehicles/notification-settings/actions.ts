"use server"

import { createClient } from "@/lib/supabase/server"

export async function getVehicleTypes() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .schema("drivermgm")
      .from("notification_thresholds")
      .select("vehicle_type")
      .order("vehicle_type")

    if (error) {
      console.error("[v0] Failed to fetch vehicle types:", error)
      return []
    }

    return data.map((row: any) => row.vehicle_type)
  } catch (error) {
    console.error("[v0] Error in getVehicleTypes:", error)
    return []
  }
}

export async function getNotificationThresholds(companyCode?: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .schema("drivermgm")
      .from("notification_thresholds")
      .select("*")
      .order("vehicle_type")

    if (error) {
      console.error("[v0] Failed to fetch notification thresholds:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("[v0] Error in getNotificationThresholds:", error)
    return []
  }
}

export async function getNotificationThresholdByType(vehicleType: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .schema("drivermgm")
      .from("notification_thresholds")
      .select("*")
      .eq("vehicle_type", vehicleType)
      .single()

    if (error) {
      console.error("[v0] Failed to fetch notification threshold:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("[v0] Error in getNotificationThresholdByType:", error)
    return null
  }
}

export async function updateNotificationThreshold(vehicleType: string, thresholds: Record<string, number | string[]>) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .schema("drivermgm")
      .from("notification_thresholds")
      .update({
        ...thresholds,
        updated_at: new Date().toISOString()
      })
      .eq("vehicle_type", vehicleType)

    if (error) {
      console.error("[v0] Failed to update notification threshold:", error)
      return { success: false, error: "업데이트에 실패했습니다." }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in updateNotificationThreshold:", error)
    return { success: false, error: "업데이트에 실패했습니다." }
  }
}
