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

  return (
    <div className="min-h-screen bg-muted">
      <VehicleHeader />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <VehicleDetailForm vehicle={vehicle} thresholds={thresholds} />
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
