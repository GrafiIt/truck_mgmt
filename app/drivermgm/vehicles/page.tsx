"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import VehicleHeader from "./vehicle-header"
import VehicleListClient from "./vehicle-list-client"

function VehiclesContent() {
  const searchParams = useSearchParams()
  const companyCodeFromUrl = searchParams.get("cc") || undefined

  // 이 페이지에서는 body 스크롤을 막고 내부 컨테이너에서만 스크롤되도록 함
  useEffect(() => {
    document.body.style.overflow = "hidden"
    document.body.style.height = "100vh"
    return () => {
      document.body.style.overflow = ""
      document.body.style.height = ""
    }
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <VehicleHeader />
      <main className="flex-1 overflow-hidden container mx-auto px-4 py-6">
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
