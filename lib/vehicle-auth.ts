"use server"

import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/server"

export async function vehicleLogin(companyCode: string, username: string, password: string) {
  const supabase = await createAdminClient()

  // 1. 기업코드 확인
  const { data: company, error: companyError } = await supabase
    .from("master_user")
    .select("company_code, company_name")
    .eq("company_code", companyCode)
    .single()

  if (companyError || !company) {
    return { success: false, error: "존재하지 않는 기업코드입니다." }
  }

  // 2. 해당 기업의 사용자 테이블에서 로그인 확인
  const tableName = `vehicle_users_${companyCode}`
  
  const { data: users, error } = await supabase
    .from(tableName)
    .select("id, username")
    .eq("username", username)
    .eq("password", password)

  if (error || !users || users.length === 0) {
    return { success: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." }
  }

  // 3. 세션에 기업코드와 인증 정보 저장 (쿠키)
  const cookieStore = await cookies()
  cookieStore.set("vehicle_admin", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  cookieStore.set("company_code", companyCode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  cookieStore.set("company_name", company.company_name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  return { success: true }
}

export async function vehicleLogout() {
  const cookieStore = await cookies()
  cookieStore.delete("vehicle_admin")
  cookieStore.delete("company_code")
  cookieStore.delete("company_name")
  return { success: true }
}

export async function checkVehicleAuth() {
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.get("vehicle_admin")?.value === "true"
  return isAuthenticated
}

export async function getCompanyCode(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("company_code")?.value || null
}

export async function getCompanyName(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("company_name")?.value || null
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  try {
    const companyCode = await getCompanyCode()
    
    if (!companyCode) {
      return false
    }

    const supabase = await createAdminClient()
    const tableName = `vehicle_users_${companyCode}`
    
    const { data: users, error } = await supabase
      .from(tableName)
      .select("id, username")
      .eq("username", username)
      .eq("password", password)

    if (error || !users || users.length === 0) {
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Error verifying admin credentials:", error)
    return false
  }
}
