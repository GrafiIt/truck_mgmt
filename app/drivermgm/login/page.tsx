import { redirect } from "next/navigation"
import { checkVehicleAuth } from "@/lib/vehicle-auth"
import VehicleLoginForm from "./vehicle-login-form"
import Link from "next/link"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function VehicleLoginPage() {
  const isAuthenticated = await checkVehicleAuth()

  if (isAuthenticated) {
    redirect("/drivermgm/vehicles")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md relative">
        <Link href="/drivermgm/master-admin" className="absolute top-0 right-0">
          <Button variant="ghost" size="icon" className="hover:bg-accent">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
        
        <div className="bg-card rounded-lg shadow-xl p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">차량관리시스템</h1>
            <p className="text-muted-foreground">관리자 로그인이 필요합니다</p>
          </div>

          <VehicleLoginForm />
        </div>
      </div>
    </div>
  )
}
