import { redirect } from "next/navigation"
import { checkVehicleAuth } from "@/lib/vehicle-auth"
import VehicleHeader from "../vehicles/vehicle-header"
import UserManagement from "./user-management"
import { getVehicleUsers } from "./actions"

export default async function UsersPage() {
  const isAuthenticated = await checkVehicleAuth()

  if (!isAuthenticated) {
    redirect("/drivermgm/login")
  }

  const users = await getVehicleUsers()

  return (
    <div className="min-h-screen bg-muted">
      <VehicleHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <UserManagement initialUsers={users} />
        </div>
      </main>
    </div>
  )
}
