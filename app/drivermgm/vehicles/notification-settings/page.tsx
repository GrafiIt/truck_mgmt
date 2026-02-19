import { redirect } from "next/navigation"
import { checkVehicleAuth } from "@/lib/vehicle-auth"
import NotificationSettingsClient from "./notification-settings-client"
import VehicleHeader from "../vehicle-header"

export default async function NotificationSettingsPage() {
  const isAuthenticated = await checkVehicleAuth()

  if (!isAuthenticated) {
    redirect("/drivermgm/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <VehicleHeader />
      <main className="container mx-auto px-4 py-6">
        <NotificationSettingsClient />
      </main>
    </div>
  )
}
