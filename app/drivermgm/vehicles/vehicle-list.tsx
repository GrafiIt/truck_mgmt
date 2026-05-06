"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableRow, TableHeader } from "@/components/ui/table"
import {
  type NotificationThreshold,
  getThresholdForVehicleType,
  shouldHighlightWithThreshold,
  shouldWarnWithThreshold,
  getHighlightClass,
} from "@/lib/notification-thresholds"

interface Vehicle {
  id: number
  transporter: string
  driver_name: string
  vehicle_number: string
  manufacturer: string
  vehicle_type?: string
  release_date: string
  vehicle_age: number
  total_mileage: number
  last_monthly_mileage: number | null
  last_inspection_date: string
  inspection_result: string
  fuel_efficiency: number | null
  grease_date: string
  grease_mileage: number
  engine_oil_date: string
  engine_oil_mileage: number
  mission_oil_date: string
  mission_oil_mileage: number
  diesel_filter_date: string
  diesel_filter_mileage: number
  defu_oil_date: string
  defu_oil_mileage: number
  power_oil_date: string
  power_oil_mileage: number
  air_dryer_date: string
  air_dryer_mileage: number
  dry_filter_date: string
  dry_filter_mileage: number
  water_separator_date: string
  water_separator_mileage: number
  lining_date: string
  lining_mileage: number
  tire_date: string
  tire_mileage: number
  battery_date: string
  battery_mileage: number
  air_tank_date: string
  air_tank_mileage: number
  axle_bearing_date: string
  axle_bearing_mileage: number
  pto_joint_date: string
  pto_joint_mileage: number
  pto_pump_date: string
  pto_pump_mileage: number
  heater_date: string
  heater_mileage: number
  others_date: string
  others_mileage: number
  others_summary: string | null
}

export default function VehicleList({ vehicles, thresholds }: { vehicles: Vehicle[]; thresholds: NotificationThreshold[] }) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => vehicle.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm, vehicles])

  const handleExcelDownload = useCallback(() => {
    const headers = [
      "Transporter",
      "운전원",
      "차량번호",
      "제조사",
      "차량 종류",
      "차량출고일",
      "차량연식",
      "총주행거리",
      "전월주행거리",
      "정기검사(최근)",
      "정기검사결과",
      "구리스(날짜)",
      "구리스(주행)",
      "엔진오일(날짜)",
      "엔진오일(주행)",
      "미션오일(날짜)",
      "미션오일(주행)",
      "경유필터(날짜)",
      "경유필터(주행)",
      "데후오일(날짜)",
      "데후오일(주행)",
      "파워오일(주행)",
      "에어드라이어(날짜)",
      "드라이필터(주행)",
      "수분분리기(주행)",
      "라이닝(날짜)",
      "타이어(날짜)",
      "타이어(주행)",
      "배터리(날짜)",
      "배터리(주행)",
      "에어탱크(날짜)",
      "축베어링(날짜)",
      "PTO조인트(날짜)",
      "PTO펌프(날짜)",
      "히터(날짜)",
      "기타",
    ]

    const escapeCSV = (value: string | number | null | undefined) => {
      if (value === null || value === undefined) return ""
      const str = String(value)
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = filteredVehicles.map((v) => [
      escapeCSV(v.transporter),
      escapeCSV(v.driver_name),
      escapeCSV(v.vehicle_number),
      escapeCSV(v.manufacturer),
      escapeCSV(v.vehicle_type || "-"),
      escapeCSV(v.release_date),
      escapeCSV(v.vehicle_age),
      escapeCSV(v.total_mileage),
      escapeCSV((v as any).previous_month_mileage || 0),
      escapeCSV(v.last_inspection_date || "-"),
      escapeCSV(v.inspection_result),
      escapeCSV(v.grease_date),
      escapeCSV(v.grease_mileage),
      escapeCSV(v.engine_oil_date),
      escapeCSV(v.engine_oil_mileage),
      escapeCSV(v.mission_oil_date),
      escapeCSV(v.mission_oil_mileage),
      escapeCSV(v.diesel_filter_date),
      escapeCSV(v.diesel_filter_mileage),
      escapeCSV(v.defu_oil_date),
      escapeCSV(v.defu_oil_mileage),
      escapeCSV(v.power_oil_mileage),
      escapeCSV(v.air_dryer_date),
      escapeCSV(v.dry_filter_mileage),
      escapeCSV(v.water_separator_mileage),
      escapeCSV(v.lining_date),
      escapeCSV(v.tire_date),
      escapeCSV(v.tire_mileage),
      escapeCSV(v.battery_date),
      escapeCSV(v.battery_mileage),
      escapeCSV(v.air_tank_date),
      escapeCSV(v.axle_bearing_date),
      escapeCSV(v.pto_joint_date),
      escapeCSV(v.pto_pump_date),
      escapeCSV(v.heater_date || "-"),
      escapeCSV(v.others_summary || "-"),
    ])

    const csvContent =
      "\uFEFF" + // BOM for Excel Korean encoding
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    link.href = url
    link.download = `차량목록_${today}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [filteredVehicles])

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">차량 목록</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            차량 번호를 클릭하면 상세 정보를 확인할 수 있습니다
          </p>
        </div>
        <div className="flex items-center">
          <Input
            type="text"
            placeholder="차량 번호 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mr-2"
          />
          <div className="flex flex-col gap-2">
            <Link href="/drivermgm/vehicles/new">
              <Button className="gap-2 w-full">
                <Plus className="h-4 w-4" />
                신규 등록
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2 w-full border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-950"
              onClick={handleExcelDownload}
            >
              <Download className="h-4 w-4" />
              엑셀다운
            </Button>
          </div>
        </div>
      </div>

      <div
        className="overflow-x-auto scrollbar-visible"
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
        <Table className="w-full text-sm">
          <TableHeader>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Transporter</th>
              <th
                className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                style={{ position: "sticky", left: 0, zIndex: 3, backgroundColor: "#f3f4f6", minWidth: "80px", width: "80px" }}
              >
                운전원
              </th>
              <th
                className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                style={{ position: "sticky", left: 80, zIndex: 3, backgroundColor: "#f3f4f6", minWidth: "130px", width: "130px", boxShadow: "4px 0 6px -2px rgba(0,0,0,0.15)" }}
              >
                차량번호
              </th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">제조사</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">차량 종류</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">차량출고일</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">차량연식</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">총주행거리</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">전월주행거리</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">정기검사(최근)</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">정기검사결과</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">구리스</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">엔진오일</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">미션오일</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">경유필터</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">데후오일</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">파워오일</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">에어드라이어</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">드라이필터</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">수분분리기</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">라이닝</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">타이어</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">배터리</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">에어탱크</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">축베어링</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">PTO조인트</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">PTO펌프</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">히터</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">기타</th>
            </tr>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredVehicles.map((vehicle) => {
              const threshold = getThresholdForVehicleType(vehicle.vehicle_type, thresholds)
              const sh = (name: string, date: string | null, mileage: number | null) =>
                shouldHighlightWithThreshold(name, date, mileage, vehicle.total_mileage, threshold)
              const sw = (name: string, date: string | null, mileage: number | null) =>
                shouldWarnWithThreshold(name, date, mileage, vehicle.total_mileage, threshold)

              const highlights = {
                grease: sh("구리스", vehicle.grease_date, vehicle.grease_mileage),
                engineOil: sh("엔진오일", vehicle.engine_oil_date, vehicle.engine_oil_mileage),
                missionOil: sh("미션오일", vehicle.mission_oil_date, vehicle.mission_oil_mileage),
                dieselFilter: sh("경유필터", vehicle.diesel_filter_date, vehicle.diesel_filter_mileage),
                defuOil: sh("데후오일", vehicle.defu_oil_date, vehicle.defu_oil_mileage),
                tire: sh("타이어", vehicle.tire_date, vehicle.tire_mileage),
                dryFilter: sh("드라이필터", vehicle.air_dryer_date, vehicle.dry_filter_mileage),
                waterSeparator: sh("수분분리기", vehicle.water_separator_date, vehicle.water_separator_mileage),
                lining: sh("라이닝", vehicle.lining_date, vehicle.lining_mileage),
                battery: sh("배터리", vehicle.battery_date, vehicle.battery_mileage),
                airTank: sh("에어탱크", vehicle.air_tank_date, vehicle.air_tank_mileage),
                axleBearing: sh("축베어링", vehicle.axle_bearing_date, vehicle.axle_bearing_mileage),
                heater: sh("히터", vehicle.heater_date, vehicle.heater_mileage),
                others: sh("기타", vehicle.others_date, vehicle.others_mileage),
              }

              const warnings = {
                grease: sw("구리스", vehicle.grease_date, vehicle.grease_mileage),
                engineOil: sw("엔진오일", vehicle.engine_oil_date, vehicle.engine_oil_mileage),
                missionOil: sw("미션오일", vehicle.mission_oil_date, vehicle.mission_oil_mileage),
                dieselFilter: sw("경유필터", vehicle.diesel_filter_date, vehicle.diesel_filter_mileage),
                defuOil: sw("데후오일", vehicle.defu_oil_date, vehicle.defu_oil_mileage),
                tire: sw("타이어", vehicle.tire_date, vehicle.tire_mileage),
                dryFilter: sw("드라이필터", vehicle.air_dryer_date, vehicle.dry_filter_mileage),
                waterSeparator: sw("수분분리기", vehicle.water_separator_date, vehicle.water_separator_mileage),
                lining: sw("라이닝", vehicle.lining_date, vehicle.lining_mileage),
                battery: sw("배터리", vehicle.battery_date, vehicle.battery_mileage),
                airTank: sw("에어탱크", vehicle.air_tank_date, vehicle.air_tank_mileage),
                axleBearing: sw("축베어링", vehicle.axle_bearing_date, vehicle.axle_bearing_mileage),
                heater: sw("히터", vehicle.heater_date, vehicle.heater_mileage),
                others: sw("기타", vehicle.others_date, vehicle.others_mileage),
              }

              return (
                <TableRow key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell className="px-4 py-3 whitespace-nowrap">{vehicle.transporter}</TableCell>
                  <TableCell
                    className="px-4 py-3 whitespace-nowrap"
                    style={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "#ffffff", minWidth: "80px", width: "80px" }}
                  >
                    {vehicle.driver_name}
                  </TableCell>
                  <TableCell
                    className="px-4 py-3 whitespace-nowrap"
                    style={{ position: "sticky", left: 80, zIndex: 2, backgroundColor: "#ffffff", minWidth: "130px", width: "130px", boxShadow: "4px 0 6px -2px rgba(0,0,0,0.15)" }}
                  >
                    <Link
                      href={`/drivermgm/vehicles/${vehicle.vehicle_number}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      {vehicle.vehicle_number}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{vehicle.manufacturer}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{vehicle.vehicle_type || "-"}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{vehicle.release_date}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{vehicle.vehicle_age}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    {vehicle.total_mileage?.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    {(vehicle as any).previous_month_mileage && (vehicle as any).previous_month_mileage > 0
                      ? `${((vehicle as any).previous_month_mileage).toLocaleString()}km`
                      : "0"}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div
                      className={getHighlightClass(
                        sh("정기검사", vehicle.last_inspection_date, null),
                        sw("정기검사", vehicle.last_inspection_date, null),
                      )}
                    >
                      {vehicle.last_inspection_date || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        vehicle.inspection_result === "Pass"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {vehicle.inspection_result}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs">
                      <div className={getHighlightClass(highlights.grease, warnings.grease)}>{vehicle.grease_date}</div>
                      <div className={getHighlightClass(highlights.grease, warnings.grease) || "text-gray-500"}>
                        {vehicle.grease_mileage?.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs">
                      <div className={getHighlightClass(highlights.engineOil, warnings.engineOil)}>
                        {vehicle.engine_oil_date}
                      </div>
                      <div className={getHighlightClass(highlights.engineOil, warnings.engineOil) || "text-gray-500"}>
                        {vehicle.engine_oil_mileage?.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs">
                      <div className={getHighlightClass(highlights.missionOil, warnings.missionOil)}>
                        {vehicle.mission_oil_date}
                      </div>
                      <div className={getHighlightClass(highlights.missionOil, warnings.missionOil) || "text-gray-500"}>
                        {vehicle.mission_oil_mileage?.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs">
                      <div className={getHighlightClass(highlights.dieselFilter, warnings.dieselFilter)}>
                        {vehicle.diesel_filter_date}
                      </div>
                      <div
                        className={getHighlightClass(highlights.dieselFilter, warnings.dieselFilter) || "text-gray-500"}
                      >
                        {vehicle.diesel_filter_mileage?.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs">
                      <div className={getHighlightClass(highlights.defuOil, warnings.defuOil)}>
                        {vehicle.defu_oil_date}
                      </div>
                      <div className={getHighlightClass(highlights.defuOil, warnings.defuOil) || "text-gray-500"}>
                        {vehicle.defu_oil_mileage?.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-gray-500">{vehicle.power_oil_mileage?.toLocaleString()}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs">{vehicle.air_dryer_date}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div
                      className={`text-xs ${getHighlightClass(highlights.dryFilter, warnings.dryFilter) || "text-gray-500"}`}
                    >
                      {vehicle.dry_filter_mileage?.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div
                      className={`text-xs ${getHighlightClass(highlights.waterSeparator, warnings.waterSeparator) || "text-gray-500"}`}
                    >
                      {vehicle.water_separator_mileage?.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className={`text-xs ${getHighlightClass(highlights.lining, warnings.lining)}`}>
                      {vehicle.lining_date}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs">
                      <div className={getHighlightClass(highlights.tire, warnings.tire)}>{vehicle.tire_date}</div>
                      <div className={getHighlightClass(highlights.tire, warnings.tire) || "text-gray-500"}>
                        {vehicle.tire_mileage?.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs">
                      <div className={getHighlightClass(highlights.battery, warnings.battery)}>
                        {vehicle.battery_date}
                      </div>
                      <div className={getHighlightClass(highlights.battery, warnings.battery) || "text-gray-500"}>
                        {vehicle.battery_mileage?.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className={`text-xs ${getHighlightClass(highlights.airTank, warnings.airTank)}`}>
                      {vehicle.air_tank_date}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className={`text-xs ${getHighlightClass(highlights.axleBearing, warnings.axleBearing)}`}>
                      {vehicle.axle_bearing_date}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs">{vehicle.pto_joint_date}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs">{vehicle.pto_pump_date}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs">
                      <span
                        className={
                          highlights.heater
                            ? "font-bold text-red-600"
                            : warnings.heater
                              ? "font-bold text-blue-600"
                              : ""
                        }
                      >
                        {vehicle.heater_date || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs">
                      <span
                        className={
                          highlights.others
                            ? "font-bold text-red-600"
                            : warnings.others
                              ? "font-bold text-blue-600"
                              : ""
                        }
                      >
                        {vehicle.others_summary || "-"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">등록된 차량이 없습니다.</div>
      )}
    </Card>
  )
}
