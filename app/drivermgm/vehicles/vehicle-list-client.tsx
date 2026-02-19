"use client"

import { useEffect, useState } from "react"
import { getVehicles } from "./actions"
import { getNotificationThresholds } from "./notification-settings/actions"
import VehicleList from "./vehicle-list"
import type { NotificationThreshold } from "@/lib/notification-thresholds"

export default function VehicleListClient({ companyCodeFromUrl }: { companyCodeFromUrl?: string }) {
  const [vehicles, setVehicles] = useState([])
  const [thresholds, setThresholds] = useState<NotificationThreshold[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        
        // 1) URL 쿼리에서 company_code 확인
        // 2) 브라우저 쿠키에서 company_code 확인
        let companyCode = companyCodeFromUrl
        if (!companyCode) {
          const cookieStr = document.cookie
          const match = cookieStr.match(/company_code=([^;]+)/)
          if (match) companyCode = decodeURIComponent(match[1])
        }
        
        if (!companyCode) {
          window.location.href = "/drivermgm/login"
          return
        }
        
        const [vehicleData, thresholdData] = await Promise.all([
          getVehicles(companyCode),
          getNotificationThresholds(companyCode),
        ])
        setVehicles(vehicleData)
        setThresholds(thresholdData as NotificationThreshold[])
      } catch (err) {
        console.error("[v0] Failed to load vehicles:", err)
        setError("차량 목록을 불러오는데 실패했습니다. 페이지를 새로고침해주세요.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">차량 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }

  return <VehicleList vehicles={vehicles} thresholds={thresholds} />
}
