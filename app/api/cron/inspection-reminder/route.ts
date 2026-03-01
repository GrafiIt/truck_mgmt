import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendInspectionReminderEmail } from "@/lib/resend"

// 정기검사 경과 기준 (lib/notification-thresholds.ts 의 "정기검사" case와 동일)
const DAYS_DANGER = 180  // 빨간색 위험 (180일 이상)
const DAYS_WARNING = 150 // 파란색 경고 (150일 이상)

function daysBetween(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

export async function GET(request: NextRequest) {
  // CRON_SECRET 검증 — Vercel Cron은 Authorization: Bearer <secret> 헤더를 보냅니다
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const supabase = await createAdminClient()
  const today = toDateString(new Date())

  // 모든 회사(테넌트) 조회
  const { data: companies, error: companyError } = await supabase
    .schema("drivermgm")
    .from("master_user")
    .select("company_code, company_name")

  if (companyError || !companies || companies.length === 0) {
    console.error("[cron] Failed to fetch companies:", companyError)
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
  }

  const results: Record<string, { sent: number; skipped: number; errors: number }> = {}

  for (const company of companies) {
    const code = company.company_code
    const inspectionTable = `inspection_history_${code}`
    const vehiclesTable = `vehicles_${code}`

    results[code] = { sent: 0, skipped: 0, errors: 0 }

    // 최신 정기검사 기록 조회 (각 차량의 가장 최근 기록 1건)
    // inspection_date 기준으로 150일 이상 경과한 것만 필터링
    const { data: records, error: recordsError } = await supabase
      .schema("drivermgm")
      .from(inspectionTable)
      .select(`
        id,
        vehicle_id,
        inspection_date,
        email_1,
        email_2,
        last_email_sent_date
      `)
      .order("inspection_date", { ascending: false })

    if (recordsError) {
      console.error(`[cron] Failed to fetch inspection_history for ${code}:`, recordsError)
      results[code].errors++
      continue
    }

    if (!records || records.length === 0) {
      continue
    }

    // 차량별로 가장 최신 기록만 남기기
    const latestByVehicle = new Map<number, typeof records[0]>()
    for (const record of records) {
      if (!latestByVehicle.has(record.vehicle_id)) {
        latestByVehicle.set(record.vehicle_id, record)
      }
    }

    // 차량 정보(번호, 기사명) 조회
    const vehicleIds = Array.from(latestByVehicle.keys())
    const { data: vehicles, error: vehiclesError } = await supabase
      .schema("drivermgm")
      .from(vehiclesTable)
      .select("id, vehicle_number, driver_name")
      .in("id", vehicleIds)

    if (vehiclesError) {
      console.error(`[cron] Failed to fetch vehicles for ${code}:`, vehiclesError)
      results[code].errors++
      continue
    }

    const vehicleMap = new Map<number, { vehicle_number: string; driver_name: string | null }>()
    for (const v of vehicles ?? []) {
      vehicleMap.set(v.id, { vehicle_number: v.vehicle_number, driver_name: v.driver_name })
    }

    for (const [vehicleId, record] of latestByVehicle.entries()) {
      // 수신 이메일이 없으면 스킵
      const recipients = [record.email_1, record.email_2].filter(
        (e): e is string => typeof e === "string" && e.trim().length > 0
      )
      if (recipients.length === 0) {
        results[code].skipped++
        continue
      }

      // 경과 일수 계산
      const daysSince = daysBetween(record.inspection_date)

      // 경고/위험 구간이 아니면 스킵
      if (daysSince < DAYS_WARNING) {
        results[code].skipped++
        continue
      }

      // 오늘 이미 발송했으면 스킵 (중복 방지)
      if (record.last_email_sent_date === today) {
        results[code].skipped++
        continue
      }

      const level = daysSince >= DAYS_DANGER ? "danger" : "warning"
      const vehicle = vehicleMap.get(vehicleId)

      try {
        await sendInspectionReminderEmail({
          to: recipients,
          vehicleNumber: vehicle?.vehicle_number ?? `차량ID:${vehicleId}`,
          driverName: vehicle?.driver_name ?? null,
          inspectionDate: record.inspection_date,
          daysSince,
          level,
        })

        // last_email_sent_date 업데이트
        const { error: updateError } = await supabase
          .schema("drivermgm")
          .from(inspectionTable)
          .update({ last_email_sent_date: today })
          .eq("id", record.id)

        if (updateError) {
          console.error(`[cron] Failed to update last_email_sent_date for record ${record.id}:`, updateError)
          results[code].errors++
        } else {
          results[code].sent++
        }
      } catch (emailError) {
        console.error(`[cron] Failed to send email for vehicle ${vehicleId} (${code}):`, emailError)
        results[code].errors++
      }
    }
  }

  console.log("[cron] inspection-reminder completed:", JSON.stringify(results))
  return NextResponse.json({ success: true, date: today, results })
}
