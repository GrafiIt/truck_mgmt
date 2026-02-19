"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import VehicleHeader from "./vehicle-header"
import VehicleListClient from "./vehicle-list-client"

function VehiclesContent() {
  const searchParams = useSearchParams()
  const companyCodeFromUrl = searchParams.get("cc") || undefined

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <VehicleHeader />
      <main className="container mx-auto px-4 py-6">
        <VehicleListClient companyCodeFromUrl={companyCodeFromUrl} />
      </main>
    </div>
  )
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VehiclesContent />
    </Suspense>
  )
}
