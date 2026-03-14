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
  // inspection 타입인 레코드들 중에서 inspection_date(정비실행일)가 가장 최신인 것을 찾음
  const inspectionRecords = maintenanceRecords.filter(record => record.type === "inspection")
  console.log("[v0] All inspection records:", inspectionRecords.map(r => ({
    id: r.id,
    date_value: r.date_value,
    maintenance_date: r.maintenance_date,
    email_1: r.email_1,
    email_2: r.email_2,
  })))
  
  const lastInspection = inspectionRecords.length > 0
    ? inspectionRecords.reduce((latest, current) => {
        const latestDate = latest.date_value ? new Date(latest.date_value).getTime() : 0
        const currentDate = current.date_value ? new Date(current.date_value).getTime() : 0
        return currentDate > latestDate ? current : latest
      })
    : null
  
  console.log("[v0] Selected lastInspection:", lastInspection ? {
    id: lastInspection.id,
    date_value: lastInspection.date_value,
    email_1: lastInspection.email_1,
    email_2: lastInspection.email_2,
  } : null)
  
  const inspectionEmail1 = lastInspection?.email_1 ?? null
  const inspectionEmail2 = lastInspection?.email_2 ?? null
  console.log("[v0] Final emails:", { inspectionEmail1, inspectionEmail2 })

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
