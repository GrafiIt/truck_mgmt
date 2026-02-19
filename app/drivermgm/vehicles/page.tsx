import { redirect } from "next/navigation"
import { checkVehicleAuth } from "@/lib/vehicle-auth"
import VehicleHeader from "./vehicle-header"
import VehicleListClient from "./vehicle-list-client"

export default async function VehiclesPage() {
  const isAuthenticated = await checkVehicleAuth()

  if (!isAuthenticated) {
    redirect("/drivermgm/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <VehicleHeader />
      <main className="container mx-auto px-4 py-6">
        <VehicleListClient />
      </main>
    </div>
  )
}
