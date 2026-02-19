"use server"

import { cookies } from "next/headers"
import { getCompanyCode } from "./vehicle-auth"

/**
 * 현재 로그인한 회사의 테이블 이름을 반환합니다.
 * 예: getTableName("vehicles") => "vehicles_human"
 */
export async function getTableName(baseTableName: string): Promise<string> {
  const companyCode = await getCompanyCode()
  
  if (!companyCode) {
    throw new Error("회사 코드를 찾을 수 없습니다. 다시 로그인해주세요.")
  }
  
  return `${baseTableName}_${companyCode}`
}

/**
 * 특정 회사 코드에 대한 테이블 이름을 반환합니다.
 */
export async function getTableNameForCompany(baseTableName: string, companyCode: string): Promise<string> {
  return `${baseTableName}_${companyCode}`
}

/**
 * NextRequest에서 company_code를 가져옵니다 (API 라우트용)
 */
export async function getCompanyCodeFromRequest(request: any): Promise<string | null> {
  try {
    // 방법 1: 쿠키 헤더에서 직접 추출
    const cookieHeader = request.headers.get("cookie")
    console.log("[v0] Cookie header received:", cookieHeader ? "Yes" : "No")
    
    if (cookieHeader) {
      const companyCodeMatch = cookieHeader.match(/company_code=([^;]+)/)
      if (companyCodeMatch && companyCodeMatch[1]) {
        const companyCode = decodeURIComponent(companyCodeMatch[1])
        console.log("[v0] Company code extracted from header:", companyCode)
        return companyCode
      }
    }
    
    // 방법 2: 쿠키 저장소에서 직접 읽기
    const cookieStore = await cookies()
    const companyCodeCookie = cookieStore.get("company_code")
    if (companyCodeCookie) {
      console.log("[v0] Company code from cookie store:", companyCodeCookie.value)
      return companyCodeCookie.value
    }
    
    console.log("[v0] No company code found in either method")
    return null
  } catch (error) {
    console.error("[v0] Error extracting company code:", error)
    return null
  }
}

/**
 * API 라우트에서 사용할 동적 테이블 이름 생성
 */
export async function getTableNameFromRequest(request: any, baseTableName: string): Promise<string> {
  const companyCode = await getCompanyCodeFromRequest(request)

  if (!companyCode) {
    console.error("[v0] Company code not found. Available headers:", request.headers.keys())
    throw new Error("회사 코드를 찾을 수 없습니다.")
  }

  return `${baseTableName}_${companyCode}`
}
