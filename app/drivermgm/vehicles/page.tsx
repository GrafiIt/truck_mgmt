"use client"

import { useEffect, useState } from "react"
import VehicleHeader from "./vehicle-header"
import VehicleListClient from "./vehicle-list-client"

export default function VehiclesPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/vehicle-auth/check")
        const data = await res.json()
        if (data.authenticated) {
          setIsAuthenticated(true)
        } else {
          window.location.href = "/drivermgm/login"
        }
      } catch {
        window.location.href = "/drivermgm/login"
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [])

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
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
