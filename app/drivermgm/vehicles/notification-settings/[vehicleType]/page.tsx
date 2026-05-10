import { redirect } from "next/navigation"
import { checkVehicleAuth } from "@/lib/vehicle-auth"
import VehicleHeader from "../../vehicle-header"
import NotificationThresholdForm from "./notification-threshold-form"
import { getNotificationThresholdByType } from "../actions"

export const dynamic = "force-dynamic"

export default async function NotificationThresholdEditPage({
  params,
}: {
  params: Promise<{ vehicleType: string }>
}) {
  const isAuthenticated = await checkVehicleAuth()

  if (!isAuthenticated) {
    redirect("/drivermgm/login")
  }

  const { vehicleType } = await params
  const decodedVehicleType = decodeURIComponent(vehicleType)
  const threshold = await getNotificationThresholdByType(decodedVehicleType)

  if (!threshold) {
    redirect("/drivermgm/vehicles/notification-settings")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <VehicleHeader />
      <main className="container mx-auto px-4 py-6">
        <NotificationThresholdForm vehicleType={decodedVehicleType} threshold={threshold} />
      </main>
    </div>
  )
}
