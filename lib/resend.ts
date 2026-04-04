import { Resend } from "resend"

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable")
  }
  return new Resend(apiKey)
}

export function getFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL
  if (!from) {
    throw new Error("Missing RESEND_FROM_EMAIL environment variable")
  }
  return from
}

export interface InspectionReminderEmailParams {
  to: string[]
  vehicleNumber: string
  driverName: string | null
  inspectionDate: string
  daysSince: number
  level: "warning" | "danger"
}

/**
 * 정기검사 알람 이메일을 발송합니다.
 * level === "warning": 150일 이상 (파란색 경고)
 * level === "danger":  180일 이상 (빨간색 위험)
 * 발신자 주소: no-reply@1004.help (RESEND_FROM_EMAIL 환경 변수)
 */
export async function sendInspectionReminderEmail(params: InspectionReminderEmailParams): Promise<void> {
  const { to, vehicleNumber, driverName, inspectionDate, daysSince, level } = params
  const resend = getResendClient()
  const from = getFromEmail()

  const levelLabel = level === "danger" ? "위험" : "경고"
  const levelColor = level === "danger" ? "#dc2626" : "#2563eb"
  const subject = `[${levelLabel}] 차량 ${vehicleNumber} 정기검사 ${daysSince}일 경과`

  const driverLine = driverName ? `<p style="margin:4px 0;"><strong>기사명:</strong> ${driverName}</p>` : ""

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;font-family:'Apple SD Gothic Neo',AppleGothic,'Malgun Gothic',sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.12);">
          <!-- 헤더 -->
          <tr>
            <td style="background:${levelColor};padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">정기검사 알람 [${levelLabel}]</h1>
            </td>
          </tr>
          <!-- 본문 -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;color:#333;">아래 차량의 정기검사 경과 기간을 확인해주세요.</p>
              <table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;width:100%;">
                <tr style="background:#f9fafb;">
                  <td style="padding:12px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #e5e7eb;">차량번호</td>
                  <td style="padding:12px 16px;font-size:14px;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;">${vehicleNumber}</td>
                </tr>
                ${driverName ? `
                <tr>
                  <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">기사명</td>
                  <td style="padding:12px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">${driverName}</td>
                </tr>` : ""}
                <tr style="background:#f9fafb;">
                  <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">마지막 검사일</td>
                  <td style="padding:12px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">${inspectionDate}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:13px;color:#6b7280;">경과 일수</td>
                  <td style="padding:12px 16px;font-size:14px;color:${levelColor};font-weight:700;">${daysSince}일 경과</td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
                ※ 이 메일은 차량 정기검사 알람 시스템에서 자동으로 발송됩니다.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()

  await resend.emails.send({
    from,
    to,
    subject,
    html,
  })
}
