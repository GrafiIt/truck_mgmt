"use client"

import { useRouter } from "next/navigation"
import { checkVehicleAuth } from "@/lib/vehicle-auth"
import { useEffect, useState, useMemo } from "react"
import VehicleHeader from "../vehicles/vehicle-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUp, ArrowDown } from "lucide-react"

interface StatisticsRow {
  vehicleNumber: string
  drivingDistance: number
  fuelCost: number
  fuelVolume: number
  maintenanceCost: number
  fuelEfficiency: number
}

type SortField = "vehicleNumber" | "drivingDistance" | "fuelCost" | "fuelVolume" | "maintenanceCost" | "fuelEfficiency"
type SortOrder = "asc" | "desc"

// Mock Data
const MOCK_DATA: StatisticsRow[] = [
  {
    vehicleNumber: "경남81사6149",
    drivingDistance: 8500,
    fuelCost: 450000,
    fuelVolume: 1197,
    maintenanceCost: 200000,
    fuelEfficiency: 7.1,
  },
  {
    vehicleNumber: "경남81사9082",
    drivingDistance: 10200,
    fuelCost: 550000,
    fuelVolume: 1821,
    maintenanceCost: 450000,
    fuelEfficiency: 5.6,
  },
  {
    vehicleNumber: "경남81사9091",
    drivingDistance: 9100,
    fuelCost: 330000,
    fuelVolume: 1673,
    maintenanceCost: 250000,
    fuelEfficiency: 5.4,
  },
]

export default function StatisticsPage() {
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortField, setSortField] = useState<SortField>("vehicleNumber")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  useEffect(() => {
    const authenticate = async () => {
      const isAuthenticated = await checkVehicleAuth()
      if (!isAuthenticated) {
        router.push("/drivermgm/login")
      } else {
        setIsAuthed(true)
        // Set default dates: January 1 of current year to today
        const today = new Date()
        const yearStart = new Date(today.getFullYear(), 0, 1)
        setStartDate(yearStart.toISOString().split("T")[0])
        setEndDate(today.toISOString().split("T")[0])
      }
    }
    authenticate()
  }, [router])

  const sortedData = useMemo(() => {
    const data = [...MOCK_DATA]
    data.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (typeof aValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue as string) : (bValue as string).localeCompare(aValue)
      }

      if (sortOrder === "asc") {
        return (aValue as number) - (bValue as number)
      } else {
        return (bValue as number) - (aValue as number)
      }
    })
    return data
  }, [sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 inline ml-1" />
    )
  }

  const calculateTotals = () => {
    return {
      drivingDistance: sortedData.reduce((sum, row) => sum + row.drivingDistance, 0),
      fuelCost: sortedData.reduce((sum, row) => sum + row.fuelCost, 0),
      fuelVolume: sortedData.reduce((sum, row) => sum + row.fuelVolume, 0),
      maintenanceCost: sortedData.reduce((sum, row) => sum + row.maintenanceCost, 0),
      fuelEfficiency: sortedData.reduce((sum, row) => sum + row.fuelEfficiency, 0),
    }
  }

  const calculateAverages = () => {
    const totals = calculateTotals()
    const count = sortedData.length
    return {
      drivingDistance: (totals.drivingDistance / count).toFixed(1),
      fuelCost: (totals.fuelCost / count).toFixed(0),
      fuelVolume: (totals.fuelVolume / count).toFixed(1),
      maintenanceCost: (totals.maintenanceCost / count).toFixed(0),
      fuelEfficiency: (totals.fuelEfficiency / count).toFixed(2),
    }
  }

  if (!isAuthed) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />
  }

  const totals = calculateTotals()
  const averages = calculateAverages()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <VehicleHeader />
      <main className="container mx-auto px-4 py-6">
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">차량 통계</h2>

            {/* Date Filter Section */}
            <div className="flex gap-4 items-end mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시작일
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  종료일
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button className="px-6">검색</Button>
            </div>
          </div>

          {/* Statistics Table */}
          <div
            className="scrollbar-visible overflow-x-auto"
            style={{
              scrollbarWidth: "auto",
              scrollbarColor: "#3b82f6 #e5e7eb",
            }}
          >
            <style jsx>{`
              .scrollbar-visible::-webkit-scrollbar {
                height: 12px;
                display: block;
              }
              .scrollbar-visible::-webkit-scrollbar-track {
                background: #e5e7eb;
                border-radius: 6px;
              }
              .scrollbar-visible::-webkit-scrollbar-thumb {
                background: #3b82f6;
                border-radius: 6px;
                border: 2px solid #e5e7eb;
              }
              .scrollbar-visible::-webkit-scrollbar-thumb:hover {
                background: #2563eb;
              }
            `}</style>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                  <th
                    onClick={() => handleSort("vehicleNumber")}
                    className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center">
                      차량번호
                      {renderSortIcon("vehicleNumber")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("drivingDistance")}
                    className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center justify-end">
                      운행거리(km)
                      {renderSortIcon("drivingDistance")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("fuelCost")}
                    className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center justify-end">
                      주유비(원)
                      {renderSortIcon("fuelCost")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("fuelVolume")}
                    className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center justify-end">
                      주유량(L)
                      {renderSortIcon("fuelVolume")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("maintenanceCost")}
                    className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center justify-end">
                      정비비(원)
                      {renderSortIcon("maintenanceCost")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("fuelEfficiency")}
                    className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center justify-end">
                      연비(km/L)
                      {renderSortIcon("fuelEfficiency")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedData.map((row) => (
                  <tr key={row.vehicleNumber} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.vehicleNumber}</td>
                    <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{row.drivingDistance.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{row.fuelCost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{row.fuelVolume.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{row.maintenanceCost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{row.fuelEfficiency.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">합계</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{totals.drivingDistance.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{totals.fuelCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{totals.fuelVolume.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{totals.maintenanceCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{totals.fuelEfficiency.toFixed(1)}</td>
                </tr>
                <tr className="border-t border-blue-200 dark:border-blue-800">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">평균</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{averages.drivingDistance}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{averages.fuelCost}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{averages.fuelVolume}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{averages.maintenanceCost}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{averages.fuelEfficiency}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
