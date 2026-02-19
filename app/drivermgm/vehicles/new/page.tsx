import { redirect } from "next/navigation"
import { checkVehicleAuth } from "@/lib/vehicle-auth"
import VehicleHeader from "../vehicle-header"
import NewVehicleForm from "./new-vehicle-form"

export default async function NewVehiclePage() {
  console.log("[v0] NewVehiclePage rendering...")

  const isAuthenticated = await checkVehicleAuth()
  console.log("[v0] isAuthenticated:", isAuthenticated)

  if (!isAuthenticated) {
    console.log("[v0] Not authenticated, redirecting to login")
    redirect("/drivermgm/login")
  }

  console.log("[v0] Rendering NewVehiclePage content")
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <VehicleHeader />
      <main className="container mx-auto px-4 py-6">
        <NewVehicleForm />
      </main>
    </div>
  )
}
