"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getTableName } from "@/lib/table-utils"

export async function getVehicleUsers() {
  const supabase = await createAdminClient()
  const tableName = await getTableName("vehicle_users")

  const { data, error } = await supabase
    .from(tableName)
    .select("id, username, created_at")
    .order("id", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching vehicle users:", error)
    return []
  }

  return data || []
}

export async function addVehicleUser(username: string, password: string) {
  const supabase = await createAdminClient()
  const tableName = await getTableName("vehicle_users")

  // 중복 확인
  const { data: existing } = await supabase.from(tableName).select("id").eq("username", username).single()

  if (existing) {
    return { success: false, error: "이미 존재하는 사용자명입니다." }
  }

  const { error } = await supabase.from(tableName).insert({
    username,
    password,
  })

  if (error) {
    console.error("[v0] Error adding user:", error)
    return { success: false, error: "사용자 추가에 실패했습니다." }
  }

  return { success: true }
}

export async function deleteVehicleUser(userId: number) {
  const supabase = await createAdminClient()
  const tableName = await getTableName("vehicle_users")

  const { error} = await supabase.from(tableName).delete().eq("id", userId)

  if (error) {
    console.error("[v0] Error deleting user:", error)
    return { success: false, error: "사용자 삭제에 실패했습니다." }
  }

  return { success: true }
}

export async function updateVehicleUserPassword(userId: number, newPassword: string) {
  const supabase = await createAdminClient()
  const tableName = await getTableName("vehicle_users")

  const { error } = await supabase
    .from(tableName)
    .update({ password: newPassword, updated_at: new Date().toISOString() })
    .eq("id", userId)

  if (error) {
    console.error("[v0] Error updating password:", error)
    return { success: false, error: "비밀번호 변경에 실패했습니다." }
  }

  return { success: true }
}
