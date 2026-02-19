import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { companyCode, companyName } = await request.json()

    if (!companyCode) {
      return NextResponse.json(
        { success: false, error: "회사 코드가 없습니다." },
        { status: 400 }
      )
    }

    // NextResponse에 쿠키를 직접 설정 (브라우저 Set-Cookie 헤더로 전달됨)
    const response = NextResponse.json({ success: true })

    const cookieOptions = {
      httpOnly: false,
      secure: false,
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    }

    response.cookies.set("vehicle_admin", "true", cookieOptions)
    response.cookies.set("company_code", companyCode, cookieOptions)
    response.cookies.set("company_name", companyName || "", cookieOptions)

    return response
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "쿠키 설정 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
