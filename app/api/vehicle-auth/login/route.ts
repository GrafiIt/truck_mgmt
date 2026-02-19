import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { companyCode, username, password } = await request.json()
    console.log("[v0] API Login attempt:", companyCode, username)

    const supabase = await createAdminClient()

    // 1. 기업코드 확인
    const { data: company, error: companyError } = await supabase
      .from("master_user")
      .select("company_code, company_name")
      .eq("company_code", companyCode)
      .single()

    console.log("[v0] API Company result:", { company, companyError })

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

    console.log("[v0] API User result:", { users, error })

    if (error || !users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      )
    }

    // 3. NextResponse에 쿠키를 직접 설정
    const response = NextResponse.json({ success: true })
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    }

    response.cookies.set("vehicle_admin", "true", cookieOptions)
    response.cookies.set("company_code", companyCode, cookieOptions)
    response.cookies.set("company_name", company.company_name, cookieOptions)

    console.log("[v0] API Login success, cookies set on response")

    return response
  } catch (err) {
    console.error("[v0] API Login error:", err)
    return NextResponse.json(
      { success: false, error: "로그인 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
