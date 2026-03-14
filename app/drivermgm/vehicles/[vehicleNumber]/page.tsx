import { redirect, notFound } from "next/navigation"
import { checkVehicleAuth } from "@/lib/vehicle-auth"
import { getVehicleByNumber, getMaintenanceRecords } from "../actions"
import { getNotificationThresholds } from "../notification-settings/actions"
import VehicleHeader from "../vehicle-header"
import VehicleDetailForm from "./vehicle-detail-form"
import MaintenanceHistory from "./maintenance-history"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ vehicleNumber: string }>
}) {
  const { vehicleNumber } = await params

  if (vehicleNumber === "new") {
    redirect("/drivermgm/vehicles/new")
  }

  const isAuthenticated = await checkVehicleAuth()

  if (!isAuthenticated) {
    redirect("/drivermgm/login")
  }

  const vehicle = await getVehicleByNumber(decodeURIComponent(vehicleNumber))

  if (!vehicle) {
    notFound()
  }

  const [maintenanceRecords, thresholds] = await Promise.all([
    getMaintenanceRecords(vehicle.id),
    getNotificationThresholds(),
  ])

  // 가장 최근 주유 기록에서 주유량을 가져오기
  const lastRefueling = maintenanceRecords.find(record => record.field_name === "refueling")
  const lastRefuelAmount = lastRefueling?.text_value ? parseFloat(lastRefueling.text_value) : 0

  // 가장 최근 정기검사 기록에서 이메일 추출
  // inspection 타입인 레코드들 중에서 현재 날짜 이전의 가장 최신 날짜를 찾음
  const inspectionRecords = maintenanceRecords.filter(record => record.type === "inspection")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 현재 날짜 이전의 레코드만 필터링
  const pastInspectionRecords = inspectionRecords.filter(record => {
    const recordDate = record.date_value ? new Date(record.date_value) : null
    return recordDate && recordDate.getTime() <= today.getTime()
  })
  
  // 날짜가 가장 최신인 레코드 찾기
  const lastInspection = pastInspectionRecords.length > 0
    ? pastInspectionRecords.reduce((latest, current) => {
        const latestDate = latest.date_value ? new Date(latest.date_value).getTime() : 0
        const currentDate = current.date_value ? new Date(current.date_value).getTime() : 0
        return currentDate > latestDate ? current : latest
      })
    : null
  
  const inspectionEmail1 = lastInspection?.email_1 ?? null
  const inspectionEmail2 = lastInspection?.email_2 ?? null

  return (
    <div className="min-h-screen bg-muted">
      <VehicleHeader />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <VehicleDetailForm
          vehicle={vehicle}
          thresholds={thresholds}
          lastRefuelAmount={lastRefuelAmount}
          inspectionEmail1={inspectionEmail1}
          inspectionEmail2={inspectionEmail2}
        />
        <MaintenanceHistory
          vehicleId={vehicle.id}
          vehicleNumber={vehicle.vehicle_number}
          vehicle={vehicle}
          records={maintenanceRecords}
        />
      </main>
    </div>
  )
}
