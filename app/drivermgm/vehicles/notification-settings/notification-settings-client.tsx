"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowDownAZ, ArrowUpAZ, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getNotificationThresholds, getVehicleTypes } from "./actions"

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
}

export default function NotificationSettingsClient() {
  const router = useRouter()
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([])
  const [thresholds, setThresholds] = useState<Record<string, NotificationThreshold>>({})
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    async function loadData() {
      try {
        const [types, thresholdsData] = await Promise.all([
          getVehicleTypes(),
          getNotificationThresholds()
        ])
        setVehicleTypes(types)
        
        const thresholdsMap: Record<string, NotificationThreshold> = {}
        thresholdsData.forEach((threshold) => {
          thresholdsMap[threshold.vehicle_type] = threshold
        })
        setThresholds(thresholdsMap)
      } catch (error) {
        console.error("[v0] Failed to load notification settings:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const sortedVehicleTypes = [...vehicleTypes].sort((a, b) =>
    sortOrder === "asc" ? a.localeCompare(b, "ko") : b.localeCompare(a, "ko")
  )

  const handleVehicleTypeClick = (vehicleType: string) => {
    const threshold = thresholds[vehicleType]
    if (threshold) {
      router.push(`/drivermgm/vehicles/notification-settings/${encodeURIComponent(vehicleType)}`)
    }
  }

  if (loading) {
    return (
      <Card className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/drivermgm/vehicles">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">알림 설정</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">차량 종류별 정비 알림 기준을 설정하세요</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
          className="gap-2 shrink-0"
        >
          {sortOrder === "asc" ? (
            <>
              <ArrowDownAZ className="h-4 w-4" />
              오름차순
            </>
          ) : (
            <>
              <ArrowUpAZ className="h-4 w-4" />
              내림차순
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3">
        {sortedVehicleTypes.map((vehicleType) => (
          <button
            key={vehicleType}
            onClick={() => handleVehicleTypeClick(vehicleType)}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {vehicleType.charAt(0)}
                </span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">{vehicleType}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  알림 기준 값 설정
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>

      {vehicleTypes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">등록된 차량 종류가 없습니다.</p>
        </div>
      )}
    </Card>
  )
}
