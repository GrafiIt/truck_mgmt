"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { updateNotificationThreshold } from "../actions"

interface NotificationThreshold {
  vehicle_type: string
  grease_days_red: number
  grease_days_blue: number
  engine_oil_days_red: number
  engine_oil_days_blue: number
  engine_oil_km_red: number
  engine_oil_km_blue: number
  mission_oil_km_red: number
  mission_oil_km_blue: number
  diesel_filter_km_red: number
  diesel_filter_km_blue: number
  defu_oil_days_red: number
  defu_oil_days_blue: number
  tire_days_red: number
  tire_days_blue: number
  dry_filter_days_red: number
  dry_filter_days_blue: number
  water_separator_days_red: number
  water_separator_days_blue: number
  lining_days_red: number
  lining_days_blue: number
  battery_days_red: number
  battery_days_blue: number
  air_tank_days_red: number
  air_tank_days_blue: number
  axle_bearing_days_red: number
  axle_bearing_days_blue: number
  // 신규 항목: 파워오일, 에어드라이어, PTO조인트, 히터
  power_oil_days_red: number
  power_oil_days_blue: number
  air_dryer_days_red: number
  air_dryer_days_blue: number
  pto_joint_days_red: number
  pto_joint_days_blue: number
  heater_days_red: number
  heater_days_blue: number
  // 정기검사 알림 기준 (일)
  inspection_days_red: number
  inspection_days_blue: number
  // 경고 비활성화 항목 목록
  disabled_warnings?: string[] | null
}

interface Props {
  vehicleType: string
  threshold: NotificationThreshold
}

export default function NotificationThresholdForm({ vehicleType, threshold }: Props) {
  const router = useRouter()
  const [formData, setFormData] = useState(threshold)
  const [disabledWarnings, setDisabledWarnings] = useState<string[]>(
    Array.isArray(threshold.disabled_warnings) ? threshold.disabled_warnings : []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const MAINTENANCE_ITEM_NAMES = [
    "구리스", "엔진오일", "미션오일", "경유필터", "데후오일",
    "타이어", "드라이필터", "수분분리기", "라이닝", "배터리", "에어탱크", "축베어링",
    "파워오일", "에어드라이어", "PTO조인트", "히터",
  ]

  const toggleDisabledWarning = (itemName: string) => {
    setDisabledWarnings((prev) =>
      prev.includes(itemName) ? prev.filter((n) => n !== itemName) : [...prev, itemName]
    )
  }

  const handleChange = (field: keyof NotificationThreshold, value: string) => {
    const numValue = parseInt(value) || 0
    setFormData((prev) => ({ ...prev, [field]: numValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccess(false)

    // 유효성 검사: 파란색 기준이 빨간색 기준보다 크거나 같으면 안됨
    const validationErrors: string[] = []
    
    // 일(days) 기준 검사
    const daysFields = [
      { red: "grease_days_red", blue: "grease_days_blue", name: "구리스" },
      { red: "engine_oil_days_red", blue: "engine_oil_days_blue", name: "엔진오일 (일)" },
      { red: "defu_oil_days_red", blue: "defu_oil_days_blue", name: "데후오일" },
      { red: "tire_days_red", blue: "tire_days_blue", name: "타이어" },
      { red: "dry_filter_days_red", blue: "dry_filter_days_blue", name: "드라이필터" },
      { red: "water_separator_days_red", blue: "water_separator_days_blue", name: "수분분리기" },
      { red: "lining_days_red", blue: "lining_days_blue", name: "라이닝" },
      { red: "battery_days_red", blue: "battery_days_blue", name: "배터리" },
      { red: "air_tank_days_red", blue: "air_tank_days_blue", name: "에어탱크" },
      { red: "axle_bearing_days_red", blue: "axle_bearing_days_blue", name: "축베어링" },
      { red: "power_oil_days_red", blue: "power_oil_days_blue", name: "파워오일" },
      { red: "air_dryer_days_red", blue: "air_dryer_days_blue", name: "에어드라이어" },
      { red: "pto_joint_days_red", blue: "pto_joint_days_blue", name: "PTO조인트" },
      { red: "heater_days_red", blue: "heater_days_blue", name: "히터" },
      { red: "inspection_days_red", blue: "inspection_days_blue", name: "정기검사" },
    ]

    // km 기준 검사
    const kmFields = [
      { red: "engine_oil_km_red", blue: "engine_oil_km_blue", name: "엔진오일 (km)" },
      { red: "mission_oil_km_red", blue: "mission_oil_km_blue", name: "미션오일" },
      { red: "diesel_filter_km_red", blue: "diesel_filter_km_blue", name: "경유필터" },
    ]

    const allFields = [...daysFields, ...kmFields]
    
    for (const field of allFields) {
      const redValue = formData[field.red as keyof NotificationThreshold] as number
      const blueValue = formData[field.blue as keyof NotificationThreshold] as number
      
      if (blueValue >= redValue) {
        validationErrors.push(`${field.name}`)
      }
    }

    if (validationErrors.length > 0) {
      setError(
        `파란색 표시 기준은 빨간색 표시 기준보다 크거나 같을 수 없습니다!\n문제 항목: ${validationErrors.join(", ")}`
      )
      setIsSubmitting(false)
      return
    }

    const updateData: Record<string, number | string[]> = {}
    Object.keys(formData).forEach((key) => {
      if (key !== "vehicle_type" && key !== "disabled_warnings") {
        updateData[key] = formData[key as keyof NotificationThreshold] as number
      }
    })
    updateData["disabled_warnings"] = disabledWarnings

    const result = await updateNotificationThreshold(vehicleType, updateData)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        router.push("/drivermgm/vehicles/notification-settings")
      }, 1500)
    } else {
      setError(result.error || "업데이트에 실패했습니다.")
    }

    setIsSubmitting(false)
  }

  const maintenanceItems = [
    {
      title: "구리스 (Grease)",
      fields: [
        { name: "grease_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "grease_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
    {
      title: "엔진오일 (Engine Oil)",
      fields: [
        { name: "engine_oil_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "engine_oil_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
        { name: "engine_oil_km_red", label: "빨간색 표시 기준 (km)", type: "km" },
        { name: "engine_oil_km_blue", label: "파란색 표시 기준 (km)", type: "km" },
      ],
    },
    {
      title: "미션오일 (Mission Oil)",
      fields: [
        { name: "mission_oil_km_red", label: "빨간색 표시 기준 (km)", type: "km" },
        { name: "mission_oil_km_blue", label: "파란색 표시 기준 (km)", type: "km" },
      ],
    },
    {
      title: "경유필터 (Diesel Filter)",
      fields: [
        { name: "diesel_filter_km_red", label: "빨간색 표시 기준 (km)", type: "km" },
        { name: "diesel_filter_km_blue", label: "파란색 표시 기준 (km)", type: "km" },
      ],
    },
    {
      title: "데후오일 (Defu Oil)",
      fields: [
        { name: "defu_oil_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "defu_oil_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
    {
      title: "타이어 (Tire)",
      fields: [
        { name: "tire_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "tire_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
    {
      title: "드라이필터 (Dry Filter)",
      fields: [
        { name: "dry_filter_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "dry_filter_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
    {
      title: "수분분리기 (Water Separator)",
      fields: [
        { name: "water_separator_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "water_separator_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
    {
      title: "라이닝 (Lining)",
      fields: [
        { name: "lining_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "lining_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
    {
      title: "배터리 (Battery)",
      fields: [
        { name: "battery_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "battery_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
    {
      title: "에어탱크 (Air Tank)",
      fields: [
        { name: "air_tank_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "air_tank_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
    {
      title: "축베어링 (Axle Bearing)",
      fields: [
        { name: "axle_bearing_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "axle_bearing_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
    {
      title: "파워오일 (Power Oil)",
      fields: [
        { name: "power_oil_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "power_oil_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
    {
      title: "에어드라이어 (Air Dryer)",
      fields: [
        { name: "air_dryer_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "air_dryer_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
    {
      title: "PTO조인트 (PTO Joint)",
      fields: [
        { name: "pto_joint_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "pto_joint_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
    {
      title: "히터 (Heater)",
      fields: [
        { name: "heater_days_red", label: "빨간색 표시 기준 (일)", type: "days" },
        { name: "heater_days_blue", label: "파란색 표시 기준 (일)", type: "days" },
      ],
    },
  ]

  // 정기검사 알림 설정 항목 (별도 섹션)
  const inspectionItem = {
    title: "정기검사 알림 기간 설정",
    description: "정기검사 경과 일수에 따른 이메일 알림 기준을 설정합니다.",
    fields: [
      { name: "inspection_days_red", label: "위험(빨간색) 메일 발송 기준 (일 이상)", type: "days", defaultValue: 180 },
      { name: "inspection_days_blue", label: "경고(파란색) 메일 발송 기준 (일 이상)", type: "days", defaultValue: 150 },
    ],
  }

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/drivermgm/vehicles/notification-settings">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            뒤로
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{vehicleType} 알림 설정</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">정비 항목별 알림 기준 값을 설정하세요</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          <div className="whitespace-pre-line">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
          설정이 저장되었습니다. 목록으로 돌아갑니다...
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>빨간색 표시:</strong> 교체 필요 - 기준 초과<br />
          <strong>파란색 표시:</strong> 교체 임박 - 사전 경고
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {maintenanceItems.map((item) => {
          // item.title에서 한글 이름 추출 (e.g. "구리스 (Grease)" → "구리스")
          const koreanName = item.title.split(" (")[0]
          const isDisabled = disabledWarnings.includes(koreanName)
          return (
            <div key={item.title} className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${isDisabled ? "opacity-50" : ""}`}>
                  {item.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`disable-${koreanName}`}
                    checked={isDisabled}
                    onCheckedChange={() => toggleDisabledWarning(koreanName)}
                  />
                  <Label
                    htmlFor={`disable-${koreanName}`}
                    className="text-sm font-normal text-gray-600 dark:text-gray-400 cursor-pointer select-none"
                  >
                    경고 받지 않기
                  </Label>
                </div>
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isDisabled ? "opacity-40 pointer-events-none" : ""}`}>
                {item.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                      id={field.name}
                      type="number"
                      min="0"
                      value={formData[field.name as keyof NotificationThreshold]}
                      onChange={(e) => handleChange(field.name as keyof NotificationThreshold, e.target.value)}
                      placeholder={field.type === "days" ? "일 수 입력" : "주행거리 입력"}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* 정기검사 알림 기간 설정 섹션 */}
        <div className="border-t-2 border-amber-300 dark:border-amber-600 pt-6 mt-6">
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
              {inspectionItem.title}
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {inspectionItem.description}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              * 기본값: 경고(파란색) 150일 이상, 위험(빨간색) 180일 이상
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inspectionItem.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name} className={field.name.includes("red") ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}>
                  {field.label}
                </Label>
                <Input
                  id={field.name}
                  type="number"
                  min="1"
                  value={formData[field.name as keyof NotificationThreshold] ?? field.defaultValue}
                  onChange={(e) => handleChange(field.name as keyof NotificationThreshold, e.target.value)}
                  placeholder={`기본값: ${field.defaultValue}일`}
                  className={field.name.includes("red") 
                    ? "border-red-300 focus:border-red-500 dark:border-red-700" 
                    : "border-blue-300 focus:border-blue-500 dark:border-blue-700"}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {field.name.includes("red") 
                    ? "이 일수 이상 경과 시 위험(빨간색) 이메일 발송" 
                    : "이 일수 이상 경과 시 경고(파란색) 이메일 발송"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Link href="/drivermgm/vehicles/notification-settings">
            <Button type="button" variant="outline">
              취소
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <Save className="w-4 h-4" />
            {isSubmitting ? "저장 중..." : "저장"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
