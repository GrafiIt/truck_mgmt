"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createVehicle } from "../actions"
import { formatNumberWithCommas, parseNumberFromFormatted } from "@/lib/number-formatter"

export default function NewVehicleForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // 숫자 입력 필드 상태
  const [totalMileage, setTotalMileage] = useState("")
  const [greaseMileage, setGreaseMileage] = useState("")
  const [engineOilMileage, setEngineOilMileage] = useState("")
  const [missionOilMileage, setMissionOilMileage] = useState("")
  const [dieselFilterMileage, setDieselFilterMileage] = useState("")
  const [defuOilMileage, setDefuOilMileage] = useState("")
  const [powerOilMileage, setPowerOilMileage] = useState("")
  const [dryFilterMileage, setDryFilterMileage] = useState("")
  const [waterSeparatorMileage, setWaterSeparatorMileage] = useState("")
  const [liningMileage, setLiningMileage] = useState("")
  const [tireMileage, setTireMileage] = useState("")
  const [batteryMileage, setBatteryMileage] = useState("")
  const [airTankMileage, setAirTankMileage] = useState("")
  const [axleBearingMileage, setAxleBearingMileage] = useState("")
  const [ptoJointMileage, setPtoJointMileage] = useState("")
  const [ptoPumpMileage, setPtoPumpMileage] = useState("")
  const [heaterMileage, setHeaterMileage] = useState("")

  useEffect(() => {
    console.log("[v0] NewVehicleForm mounted")
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const formData = new FormData(e.currentTarget)
      
      // 콤마가 제거된 순수 숫자값을 formData에 설정
      if (totalMileage) formData.set("total_mileage", totalMileage)
      if (greaseMileage) formData.set("grease_mileage", greaseMileage)
      if (engineOilMileage) formData.set("engine_oil_mileage", engineOilMileage)
      if (missionOilMileage) formData.set("mission_oil_mileage", missionOilMileage)
      if (dieselFilterMileage) formData.set("diesel_filter_mileage", dieselFilterMileage)
      if (defuOilMileage) formData.set("defu_oil_mileage", defuOilMileage)
      if (powerOilMileage) formData.set("power_oil_mileage", powerOilMileage)
      if (dryFilterMileage) formData.set("dry_filter_mileage", dryFilterMileage)
      if (waterSeparatorMileage) formData.set("water_separator_mileage", waterSeparatorMileage)
      if (liningMileage) formData.set("lining_mileage", liningMileage)
      if (tireMileage) formData.set("tire_mileage", tireMileage)
      if (batteryMileage) formData.set("battery_mileage", batteryMileage)
      if (airTankMileage) formData.set("air_tank_mileage", airTankMileage)
      if (axleBearingMileage) formData.set("axle_bearing_mileage", axleBearingMileage)
      if (ptoJointMileage) formData.set("pto_joint_mileage", ptoJointMileage)
      if (ptoPumpMileage) formData.set("pto_pump_mileage", ptoPumpMileage)
      if (heaterMileage) formData.set("heater_mileage", heaterMileage)
      
      const result = await createVehicle(formData)

      if (result.success) {
        console.log("[v0] Vehicle created successfully, redirecting...")
        // 약간의 지연을 주어 데이터베이스 쓰기 완료 보장
        await new Promise((resolve) => setTimeout(resolve, 500))
        router.push("/drivermgm/vehicles")
        router.refresh()
      } else {
        console.log("[v0] Vehicle creation failed:", result.error)
        setError(result.error || "차량 등록 중 오류가 발생했습니다.")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("[v0] Unexpected error in handleSubmit:", error)
      setError("차량 등록 중 예상하지 못한 오류가 발생했습니다.")
      setIsSubmitting(false)
    }
  }

  console.log("[v0] NewVehicleForm rendering")

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/drivermgm/vehicles">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">신규 차량 등록</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">새로운 차량 정보를 입력하세요</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="transporter">Transporter *</Label>
            <Input id="transporter" name="transporter" required placeholder="차량의 소유회사명" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver_name">운전원 *</Label>
            <Input id="driver_name" name="driver_name" required placeholder="홍길동" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_number">차량번호 *</Label>
            <Input id="vehicle_number" name="vehicle_number" required placeholder="부산94아2326" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_type">차량 종류</Label>
            <Select name="vehicle_type">
              <SelectTrigger>
                <SelectValue placeholder="차량 종류 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="탱크로리">탱크로리</SelectItem>
                <SelectItem value="25톤">25톤</SelectItem>
                <SelectItem value="14톤">14톤</SelectItem>
                <SelectItem value="11톤">11톤</SelectItem>
                <SelectItem value="8톤">8톤</SelectItem>
                <SelectItem value="5톤">5톤</SelectItem>
                <SelectItem value="3.5톤">3.5톤</SelectItem>
                <SelectItem value="2.5톤">2.5톤</SelectItem>
                <SelectItem value="1.2톤">1.2톤</SelectItem>
                <SelectItem value="1톤">1톤</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manufacturer">제조사 *</Label>
            <Select name="manufacturer" required>
              <SelectTrigger>
                <SelectValue placeholder="제조사 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HYUNDAI">HYUNDAI</SelectItem>
                <SelectItem value="DAEWOO">DAEWOO</SelectItem>
                <SelectItem value="VOLVO">VOLVO</SelectItem>
                <SelectItem value="Scania">Scania</SelectItem>
                <SelectItem value="MAN">MAN</SelectItem>
                <SelectItem value="IVECO">IVECO</SelectItem>
                <SelectItem value="KIA">KIA</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="release_date">차량출고일 *</Label>
            <Input id="release_date" name="release_date" type="date" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_age">차량연식</Label>
            <Input id="vehicle_age" name="vehicle_age" type="number" step="0.1" placeholder="8.0" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_mileage">총주행거리 (km)</Label>
            <Input 
              id="total_mileage" 
              name="total_mileage" 
              type="text"
              inputMode="numeric"
              value={formatNumberWithCommas(totalMileage)}
              onChange={(e) => setTotalMileage(parseNumberFromFormatted(e.target.value))}
              placeholder="100,000" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_inspection_date">정기검사(최근)</Label>
            <Input id="last_inspection_date" name="last_inspection_date" type="date" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspection_result">정기검사결과</Label>
            <Select name="inspection_result">
              <SelectTrigger>
                <SelectValue placeholder="검사 결과 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pass">Pass</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuel_efficiency">연비 (km/L)</Label>
            <Input id="fuel_efficiency" name="fuel_efficiency" type="number" step="0.1" placeholder="3.5" />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">정비 항목 (선택사항)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 구리스 */}
            <div className="space-y-2">
              <Label htmlFor="grease_date">구리스 - 날짜</Label>
              <Input id="grease_date" name="grease_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grease_mileage">구리스 - 주행거리 (km)</Label>
              <Input 
                id="grease_mileage" 
                name="grease_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(greaseMileage)}
                onChange={(e) => setGreaseMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 엔진오일 */}
            <div className="space-y-2">
              <Label htmlFor="engine_oil_date">엔진오일 - 날짜</Label>
              <Input id="engine_oil_date" name="engine_oil_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="engine_oil_mileage">엔진오일 - 주행거리 (km)</Label>
              <Input 
                id="engine_oil_mileage" 
                name="engine_oil_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(engineOilMileage)}
                onChange={(e) => setEngineOilMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 미션오일 */}
            <div className="space-y-2">
              <Label htmlFor="mission_oil_date">미션오일 - 날짜</Label>
              <Input id="mission_oil_date" name="mission_oil_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission_oil_mileage">미션오일 - 주행거리 (km)</Label>
              <Input 
                id="mission_oil_mileage" 
                name="mission_oil_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(missionOilMileage)}
                onChange={(e) => setMissionOilMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 경유필터 */}
            <div className="space-y-2">
              <Label htmlFor="diesel_filter_date">경유필터 - 날짜</Label>
              <Input id="diesel_filter_date" name="diesel_filter_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diesel_filter_mileage">경유필터 - 주행거리 (km)</Label>
              <Input 
                id="diesel_filter_mileage" 
                name="diesel_filter_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(dieselFilterMileage)}
                onChange={(e) => setDieselFilterMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 데후오일 */}
            <div className="space-y-2">
              <Label htmlFor="defu_oil_date">데후오일 - 날짜</Label>
              <Input id="defu_oil_date" name="defu_oil_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defu_oil_mileage">데후오일 - 주행거리 (km)</Label>
              <Input 
                id="defu_oil_mileage" 
                name="defu_oil_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(defuOilMileage)}
                onChange={(e) => setDefuOilMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 파워오일 */}
            <div className="space-y-2">
              <Label htmlFor="power_oil_date">파워오일 - 날짜</Label>
              <Input id="power_oil_date" name="power_oil_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="power_oil_mileage">파워오일 - 주행거리 (km)</Label>
              <Input 
                id="power_oil_mileage" 
                name="power_oil_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(powerOilMileage)}
                onChange={(e) => setPowerOilMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 에어드라이어 */}
            <div className="space-y-2">
              <Label htmlFor="air_dryer_date">에어드라이어 - 날짜</Label>
              <Input id="air_dryer_date" name="air_dryer_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="air_dryer_mileage">에어드라이어 - 주행거리 (km)</Label>
              <Input id="air_dryer_mileage" name="air_dryer_mileage" type="number" />
            </div>

            {/* 드라이필터 */}
            <div className="space-y-2">
              <Label htmlFor="dry_filter_date">드라이필터 - 날짜</Label>
              <Input id="dry_filter_date" name="dry_filter_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dry_filter_mileage">드라이필터 - 주행거리 (km)</Label>
              <Input 
                id="dry_filter_mileage" 
                name="dry_filter_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(dryFilterMileage)}
                onChange={(e) => setDryFilterMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 수분분리기 */}
            <div className="space-y-2">
              <Label htmlFor="water_separator_date">수분분리기 - 날짜</Label>
              <Input id="water_separator_date" name="water_separator_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="water_separator_mileage">수분분리기 - 주행거리 (km)</Label>
              <Input 
                id="water_separator_mileage" 
                name="water_separator_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(waterSeparatorMileage)}
                onChange={(e) => setWaterSeparatorMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 라이닝 */}
            <div className="space-y-2">
              <Label htmlFor="lining_date">라이닝 - 날짜</Label>
              <Input id="lining_date" name="lining_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lining_mileage">라이닝 - 주행거리 (km)</Label>
              <Input 
                id="lining_mileage" 
                name="lining_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(liningMileage)}
                onChange={(e) => setLiningMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 타이어 */}
            <div className="space-y-2">
              <Label htmlFor="tire_date">타이어 - 날짜</Label>
              <Input id="tire_date" name="tire_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tire_mileage">타이어 - 주행거리 (km)</Label>
              <Input 
                id="tire_mileage" 
                name="tire_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(tireMileage)}
                onChange={(e) => setTireMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 배터리 */}
            <div className="space-y-2">
              <Label htmlFor="battery_date">배터리 - 날짜</Label>
              <Input id="battery_date" name="battery_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="battery_mileage">배터리 - 주행거리 (km)</Label>
              <Input 
                id="battery_mileage" 
                name="battery_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(batteryMileage)}
                onChange={(e) => setBatteryMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 에어탱크 */}
            <div className="space-y-2">
              <Label htmlFor="air_tank_date">에어탱크 - 날짜</Label>
              <Input id="air_tank_date" name="air_tank_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="air_tank_mileage">에어탱크 - 주행거리 (km)</Label>
              <Input 
                id="air_tank_mileage" 
                name="air_tank_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(airTankMileage)}
                onChange={(e) => setAirTankMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 축베어링 */}
            <div className="space-y-2">
              <Label htmlFor="axle_bearing_date">축베어링 - 날짜</Label>
              <Input id="axle_bearing_date" name="axle_bearing_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="axle_bearing_mileage">축베어링 - 주행거리 (km)</Label>
              <Input 
                id="axle_bearing_mileage" 
                name="axle_bearing_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(axleBearingMileage)}
                onChange={(e) => setAxleBearingMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* PTO조인트 */}
            <div className="space-y-2">
              <Label htmlFor="pto_joint_date">PTO조인트 - 날짜</Label>
              <Input id="pto_joint_date" name="pto_joint_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pto_joint_mileage">PTO조인트 - 주행거리 (km)</Label>
              <Input 
                id="pto_joint_mileage" 
                name="pto_joint_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(ptoJointMileage)}
                onChange={(e) => setPtoJointMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* PTO펌프 */}
            <div className="space-y-2">
              <Label htmlFor="pto_pump_date">PTO펌프 - 날짜</Label>
              <Input id="pto_pump_date" name="pto_pump_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pto_pump_mileage">PTO펌프 - 주행거리 (km)</Label>
              <Input 
                id="pto_pump_mileage" 
                name="pto_pump_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(ptoPumpMileage)}
                onChange={(e) => setPtoPumpMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>

            {/* 히터 */}
            <div className="space-y-2">
              <Label htmlFor="heater_date">히터 - 날짜</Label>
              <Input id="heater_date" name="heater_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heater_mileage">히터 - 주행거리 (km)</Label>
              <Input 
                id="heater_mileage" 
                name="heater_mileage" 
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(heaterMileage)}
                onChange={(e) => setHeaterMileage(parseNumberFromFormatted(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-4 border-t">
          <Link href="/drivermgm/vehicles">
            <Button type="button" variant="outline" disabled={isSubmitting}>
              취소
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "등록"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
