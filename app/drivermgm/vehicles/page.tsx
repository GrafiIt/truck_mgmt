"use client"

import VehicleHeader from "./vehicle-header"
import VehicleListClient from "./vehicle-list-client"

export default function VehiclesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <VehicleHeader />
      <main className="container mx-auto px-4 py-6">
        <VehicleListClient />
      </main>
    </div>
  )
}
