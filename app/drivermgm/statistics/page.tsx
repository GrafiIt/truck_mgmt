"use client"

import { useRouter } from "next/navigation"
import { checkVehicleAuth } from "@/lib/vehicle-auth"
import { useEffect, useState, useMemo, useCallback } from "react"
import VehicleHeader from "../vehicles/vehicle-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react"
import { getVehicleStatistics, type VehicleStat } from "./actions"

interface StatisticsRow {
  vehicle_number: string
  period_mileage: number
  total_fuel_cost: number
  total_fuel_amount: number
  total_maintenance_cost: number
  fuel_efficiency: number
}

type SortField = "vehicle_number" | "period_mileage" | "total_fuel_cost" | "total_fuel_amount" | "total_maintenance_cost" | "fuel_efficiency"
type SortOrder = "asc" | "desc"

export default function StatisticsPage() {
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)
  const [companyCode, setCompanyCode] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortField, setSortField] = useState<SortField>("vehicle_number")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [data, setData] = useState<StatisticsRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const authenticate = async () => {
      const isAuthenticated = await checkVehicleAuth()
      if (!isAuthenticated) {
        router.push("/drivermgm/login")
      } else {
        setIsAuthed(true)
        
        // Get company_code from cookie (same pattern as vehicle-list-client.tsx)
        const cookieStr = document.cookie
        const match = cookieStr.match(/company_code=([^;]+)/)
        const code = match ? decodeURIComponent(match[1]) : null
        
        if (!code) {
          router.push("/drivermgm/login")
          return
        }
        
        setCompanyCode(code)
        
        // Set default dates: January 1 of current year to today (local timezone)
        const today = new Date()
        const startStr = `${today.getFullYear()}-01-01`
        const endStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
        setStartDate(startStr)
        setEndDate(endStr)
        
        // Fetch initial data with company code
        await fetchData(code, startStr, endStr)
      }
    }
    authenticate()
  }, [router])

  const fetchData = useCallback(async (code: string, start: string, end: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getVehicleStatistics(code, start, end)
      if (Array.isArray(result)) {
        setData(result)
      } else {
        setData([])
        setError("데이터를 불러올 수 없습니다.")
      }
    } catch (err) {
      console.error("[v0] fetchData error:", err)
      setData([])
      setError("데이터를 불러오는 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSearch = async () => {
    if (companyCode && startDate && endDate) {
      await fetchData(companyCode, startDate, endDate)
    }
  }

  const handleDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      setStartDate(value)
    } else {
      setEndDate(value)
    }
  }

  const sortedData = useMemo(() => {
    const dataToSort = [...data]
    dataToSort.sort((a, b) => {
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
    return dataToSort
  }, [data, sortField, sortOrder])

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
      period_mileage: sortedData.reduce((sum, row) => sum + row.period_mileage, 0),
      total_fuel_cost: sortedData.reduce((sum, row) => sum + row.total_fuel_cost, 0),
      total_fuel_amount: sortedData.reduce((sum, row) => sum + row.total_fuel_amount, 0),
      total_maintenance_cost: sortedData.reduce((sum, row) => sum + row.total_maintenance_cost, 0),
      fuel_efficiency: sortedData.reduce((sum, row) => sum + row.fuel_efficiency, 0),
    }
  }

  const calculateAverages = () => {
    const totals = calculateTotals()
    const count = sortedData.length || 1
    return {
      period_mileage: Math.round(totals.period_mileage / count).toLocaleString(),
      total_fuel_cost: Math.round(totals.total_fuel_cost / count).toLocaleString(),
      total_fuel_amount: Math.round(totals.total_fuel_amount / count).toLocaleString(),
      total_maintenance_cost: Math.round(totals.total_maintenance_cost / count).toLocaleString(),
      fuel_efficiency: (totals.fuel_efficiency / count).toFixed(1),
    }
  }

  if (!isAuthed) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />
  }

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
                  onChange={(e) => handleDateChange("start", e.target.value)}
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
                  onChange={(e) => handleDateChange("end", e.target.value)}
                  className="w-full"
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading} className="px-6">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    로딩중
                  </>
                ) : (
                  "검색"
                )}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && sortedData.length === 0 && !error && (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">조회된 데이터가 없습니다.</p>
            </div>
          )}

          {/* Statistics Table */}
          {!isLoading && sortedData.length > 0 && (
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
                      onClick={() => handleSort("vehicle_number")}
                      className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <div className="flex items-center">
                        차량번호
                        {renderSortIcon("vehicle_number")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("period_mileage")}
                      className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <div className="flex items-center justify-end">
                        운행거리(km)
                        {renderSortIcon("period_mileage")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("total_fuel_cost")}
                      className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <div className="flex items-center justify-end">
                        주유비(원)
                        {renderSortIcon("total_fuel_cost")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("total_fuel_amount")}
                      className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <div className="flex items-center justify-end">
                        주유량(L)
                        {renderSortIcon("total_fuel_amount")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("total_maintenance_cost")}
                      className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <div className="flex items-center justify-end">
                        정비비(원)
                        {renderSortIcon("total_maintenance_cost")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("fuel_efficiency")}
                      className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <div className="flex items-center justify-end">
                        연비(km/L)
                        {renderSortIcon("fuel_efficiency")}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedData.map((row) => (
                    <tr key={row.vehicle_number} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.vehicle_number}</td>
                      <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{row.period_mileage.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{row.total_fuel_cost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{row.total_fuel_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{row.total_maintenance_cost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{row.fuel_efficiency.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 font-semibold">
                  <tr>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">합계</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{calculateTotals().period_mileage.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{calculateTotals().total_fuel_cost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{calculateTotals().total_fuel_amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{calculateTotals().total_maintenance_cost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{calculateTotals().fuel_efficiency.toFixed(1)}</td>
                  </tr>
                  <tr className="border-t border-blue-200 dark:border-blue-800">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">평균</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{calculateAverages().period_mileage}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{calculateAverages().total_fuel_cost}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{calculateAverages().total_fuel_amount}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{calculateAverages().total_maintenance_cost}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{calculateAverages().fuel_efficiency}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
