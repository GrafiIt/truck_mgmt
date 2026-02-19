import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.get("vehicle_admin")?.value === "true"
  const companyCode = cookieStore.get("company_code")?.value || null
  const companyName = cookieStore.get("company_name")?.value || null

  return NextResponse.json({
    authenticated: isAuthenticated,
    companyCode,
    companyName,
  })
}
