import { redirect } from "next/navigation"
import { checkVehicleAuth } from "@/lib/vehicle-auth"

export default async function DriverManagementPage() {
  const isAuthenticated = await checkVehicleAuth()

  if (!isAuthenticated) {
    redirect("/drivermgm/login")
  }

  redirect("/drivermgm/vehicles")
}
