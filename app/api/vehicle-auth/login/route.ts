import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { companyCode, username, password } = await request.json()

    const supabase = await createAdminClient()

    // 1. 기업코드 확인
    const { data: company, error: companyError } = await supabase
      .from("master_user")
      .select("company_code, company_name")
      .eq("company_code", companyCode)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: "존재하지 않는 기업코드입니다." },
        { status: 401 }
      )
    }

    // 2. 해당 기업의 사용자 테이블에서 로그인 확인
    const tableName = `vehicle_users_${companyCode}`
    const { data: users, error } = await supabase
      .from(tableName)
      .select("id, username")
      .eq("username", username)
      .eq("password", password)

    if (error || !users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      )
    }

    // 3. 쿠키 설정
    const cookieStore = await cookies()
    cookieStore.set("vehicle_admin", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })
    cookieStore.set("company_code", companyCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })
    cookieStore.set("company_name", company.company_name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json(
      { success: false, error: "로그인 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
