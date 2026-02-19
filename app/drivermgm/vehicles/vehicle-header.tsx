"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, Lightbulb } from "lucide-react"
import { vehicleLogout } from "@/lib/vehicle-auth"

export default function VehicleHeader() {
  const router = useRouter()

  const handleLogout = async () => {
    await vehicleLogout()
    router.push("/drivermgm/login")
    router.refresh()
  }

  const handleSettings = () => {
    router.push("/drivermgm/users")
  }

  const handleNotifications = () => {
    router.push("/drivermgm/vehicles/notification-settings")
  }

  const handleHome = () => {
    router.push("/drivermgm/vehicles")
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="cursor-pointer" onClick={handleHome}>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              차량관리시스템
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle Management System</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" />
              로그아웃
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNotifications} title="알림 설정">
              <Lightbulb className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSettings} title="사용자 관리">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
