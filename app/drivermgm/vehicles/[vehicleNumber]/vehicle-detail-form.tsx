"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Trash2, Edit } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteVehicle, updateVehicleBasicInfo, verifyAdminCredentials } from "../actions"
import { formatNumberWithCommas, parseNumberFromFormatted } from "@/lib/number-formatter"
import {
  type NotificationThreshold,
  getThresholdForVehicleType,
  shouldHighlightWithThreshold,
  shouldWarnWithThreshold,
  getHighlightClass,
} from "@/lib/notification-thresholds"

export default function VehicleDetailForm({
  vehicle,
  thresholds = [],
  lastRefuelAmount = 0,
  inspectionEmail1 = null,
  inspectionEmail2 = null,
}: {
  vehicle: any
  thresholds?: NotificationThreshold[]
  lastRefuelAmount?: number
  inspectionEmail1?: string | null
  inspectionEmail2?: string | null
}) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deleteUsername, setDeleteUsername] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [editUsername, setEditUsername] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({
    transporter: vehicle?.transporter || "",
    driver_name: vehicle?.driver_name || "",
    manufacturer: vehicle?.manufacturer || "",
    release_date: vehicle?.release_date || "",
    last_inspection_date: vehicle?.last_inspection_date || "",
    total_mileage: vehicle?.total_mileage ?? 0,
    vehicle_type: vehicle?.vehicle_type || "",
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const isValid = await verifyAdminCredentials(deleteUsername, deletePassword)
      if (!isValid) {
        alert("아이디 또는 비밀번호가 올바르지 않습니다.")
        setIsDeleting(false)
        return
      }

      const result = await deleteVehicle(vehicle.vehicle_number)
      if (result.success) {
        alert("차량이 삭제되었습니다.")
        router.push("/drivermgm/vehicles")
      } else {
        alert("삭제 중 오류가 발생했습니다: " + result.error)
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleEdit = async () => {
    setIsEditing(true)
    try {
      const isValid = await verifyAdminCredentials(editUsername, editPassword)
      if (!isValid) {
        alert("아이디 또는 비밀번호가 올바르지 않습니다.")
        setIsEditing(false)
        return
      }

      const result = await updateVehicleBasicInfo(vehicle.vehicle_number, editData)
      if (result.success) {
        alert("차량 정보가 수정되었습니다.")
        setEditMode(false)
        setShowEditDialog(false)
        router.refresh()
      } else {
        alert("수정 중 오류가 발생했습니다: " + result.error)
      }
    } catch (error) {
      alert("수정 중 오류가 발생했습니다.")
    } finally {
      setIsEditing(false)
    }
  }

  const fuelEfficiency = vehicle.fuel_efficiency ? `${vehicle.fuel_efficiency.toFixed(2)} km/L` : "-"

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
    dryFilter: sh("드라이필터", vehicle.dry_filter_date, vehicle.dry_filter_mileage),
    waterSeparator: sh("수분분리기", vehicle.water_separator_date, vehicle.water_separator_mileage),
    lining: sh("라이닝", vehicle.lining_date, vehicle.lining_mileage),
    battery: sh("배터리", vehicle.battery_date, vehicle.battery_mileage),
    airTank: sh("에어탱크", vehicle.air_tank_date, vehicle.air_tank_mileage),
    axleBearing: sh("축베어링", vehicle.axle_bearing_date, vehicle.axle_bearing_mileage),
    airDryer: sh("에어드라이어", vehicle.air_dryer_date, vehicle.air_dryer_mileage),
    ptoJoint: sh("PTO조인트", vehicle.pto_joint_date, vehicle.pto_joint_mileage),
    ptoJump: sh("PTO펌프", vehicle.pto_pump_date, vehicle.pto_pump_mileage),
    heater: sh("히터", vehicle.heater_date, vehicle.heater_mileage),
    inspection: sh("정기검사", vehicle.last_inspection_date, null),
  }

  const warnings = {
    grease: sw("구리스", vehicle.grease_date, vehicle.grease_mileage),
    engineOil: sw("엔진오일", vehicle.engine_oil_date, vehicle.engine_oil_mileage),
    missionOil: sw("미션오일", vehicle.mission_oil_date, vehicle.mission_oil_mileage),
    dieselFilter: sw("경유필터", vehicle.diesel_filter_date, vehicle.diesel_filter_mileage),
    defuOil: sw("데후오일", vehicle.defu_oil_date, vehicle.defu_oil_mileage),
    tire: sw("타이어", vehicle.tire_date, vehicle.tire_mileage),
    dryFilter: sw("드라이필터", vehicle.dry_filter_date, vehicle.dry_filter_mileage),
    waterSeparator: sw("수분분리기", vehicle.water_separator_date, vehicle.water_separator_mileage),
    lining: sw("라이닝", vehicle.lining_date, vehicle.lining_mileage),
    battery: sw("배터리", vehicle.battery_date, vehicle.battery_mileage),
    airTank: sw("에어탱크", vehicle.air_tank_date, vehicle.air_tank_mileage),
    axleBearing: sw("축베어링", vehicle.axle_bearing_date, vehicle.axle_bearing_mileage),
    airDryer: sw("에어드라이어", vehicle.air_dryer_date, vehicle.air_dryer_mileage),
    ptoJoint: sw("PTO조인트", vehicle.pto_joint_date, vehicle.pto_joint_mileage),
    ptoJump: sw("PTO펌프", vehicle.pto_pump_date, vehicle.pto_pump_mileage),
    heater: sw("히터", vehicle.heater_date, vehicle.heater_mileage),
    inspection: sw("정기검사", vehicle.last_inspection_date, null),
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로
            </Button>
            <CardTitle>차량 상세 정보 - {vehicle.vehicle_number}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditData({
                  transporter: vehicle.transporter || "",
                  driver_name: vehicle.driver_name || "",
                  manufacturer: vehicle.manufacturer || "",
                  release_date: vehicle.release_date || "",
                  last_inspection_date: vehicle.last_inspection_date || "",
                  total_mileage: vehicle.total_mileage ?? 0,
                  vehicle_type: vehicle.vehicle_type || "",
                })
                setShowEditDialog(true)
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              수정
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              삭제
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Transporter</Label>
            <Input value={vehicle.transporter || ""} disabled className="bg-gray-50" />
          </div>
          <div>
            <Label>운전원</Label>
            <Input value={vehicle.driver_name || ""} disabled className="bg-gray-50" />
          </div>
          <div>
            <Label>차량 종류</Label>
            <Input value={vehicle.vehicle_type || ""} disabled className="bg-gray-50" />
          </div>
          <div>
            <Label>제조사</Label>
            <Input value={vehicle.manufacturer || ""} disabled className="bg-gray-50" />
          </div>
          <div>
            <Label>차량출고일</Label>
            <Input type="date" value={vehicle.release_date || ""} disabled className="bg-gray-50" />
          </div>
          <div>
            <Label>총주행거리 (km)</Label>
            <Input value={vehicle.total_mileage?.toLocaleString() || ""} disabled className="bg-gray-50" />
          </div>
          <div>
            <Label>정기검사(최근)</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.last_inspection_date || ""}
                disabled
                className={`bg-gray-50 ${highlights.inspection ? "font-bold text-red-600" : warnings.inspection ? "font-bold text-blue-600" : ""}`}
              />
              <Input value={vehicle.inspection_name || ""} disabled className="bg-gray-50" placeholder="검사명" />
            </div>
            {(() => {
              const inspectionDate = vehicle.last_inspection_date
                ? new Date(vehicle.last_inspection_date)
                : null
              const today = new Date()
              const daysPassed = inspectionDate
                ? Math.floor((today.getTime() - inspectionDate.getTime()) / (1000 * 60 * 60 * 24))
                : null
              // 차량 종류별 정기검사 임계값 사용
              const inspectionDaysBlue = threshold.inspection_days_blue ?? 150
              const inspectionDaysRed = threshold.inspection_days_red ?? 180
              const daysUntilBlue = daysPassed !== null ? inspectionDaysBlue - daysPassed : null
              const daysUntilRed = daysPassed !== null ? inspectionDaysRed - daysPassed : null

              const emailText = [inspectionEmail1, inspectionEmail2].filter(Boolean).join(", ")

              let remainingLabel = ""
              let remainingClass = "text-gray-500"
              if (daysUntilRed !== null) {
                if (daysUntilRed <= 0) {
                  remainingLabel = `위험 발송 초과 (${Math.abs(daysUntilRed)}일 경과)`
                  remainingClass = "text-red-600 font-semibold"
                } else if (daysUntilBlue !== null && daysUntilBlue <= 0) {
                  remainingLabel = `경고 발송까지 초과 / 위험까지 ${daysUntilRed}일`
                  remainingClass = "text-blue-600 font-semibold"
                } else if (daysUntilBlue !== null) {
                  remainingLabel = `경고까지 ${daysUntilBlue}일 / 위험까지 ${daysUntilRed}일`
                  remainingClass = "text-gray-500"
                }
              }

              if (!emailText && !remainingLabel) return null

              return (
                <div className="mt-1 space-y-0.5" style={{ fontSize: "11px" }}>
                  {emailText && (
                    <p className="text-gray-500">
                      알람 수신: {emailText}
                    </p>
                  )}
                  {remainingLabel && (
                    <p className={remainingClass}>{remainingLabel}</p>
                  )}
                </div>
              )
            })()}
          </div>
          <div>
            <Label>정기검사결과</Label>
            <Input value={vehicle.inspection_result || "No"} disabled className="bg-gray-50" />
          </div>
          <div className="col-span-full md:col-span-1">
            <Label>합격/불합격 참고사항</Label>
            <Textarea
              value={vehicle.inspection_notes || ""}
              disabled
              className="bg-gray-50 resize-none"
              rows={2}
              placeholder="참고사항 없음"
            />
          </div>

          {/* 정비 항목들 */}
          <div className="col-span-full">
            <h3 className="text-lg font-semibold mb-4 mt-4">정비 항목 (최종 저장 값)</h3>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>연비</Label>
            <Input value={fuelEfficiency} disabled className="bg-gray-50" />
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>마지막 주유량</Label>
            <Input value={lastRefuelAmount ? `${lastRefuelAmount.toFixed(2)} L` : "-"} disabled className="bg-gray-50" />
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>구리스</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.grease_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.grease, warnings.grease)}`}
              />
              <Input
                value={vehicle.grease_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.grease, warnings.grease)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>엔진오일</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.engine_oil_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.engineOil, warnings.engineOil)}`}
              />
              <Input
                value={vehicle.engine_oil_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.engineOil, warnings.engineOil)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>미션오일</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.mission_oil_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.missionOil, warnings.missionOil)}`}
              />
              <Input
                value={vehicle.mission_oil_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.missionOil, warnings.missionOil)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>경유필터</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.diesel_filter_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.dieselFilter, warnings.dieselFilter)}`}
              />
              <Input
                value={vehicle.diesel_filter_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.dieselFilter, warnings.dieselFilter)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>데후오일</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.defu_oil_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.defuOil, warnings.defuOil)}`}
              />
              <Input
                value={vehicle.defu_oil_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.defuOil, warnings.defuOil)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>파워오일</Label>
            <div className="flex gap-2">
              <Input type="date" value={vehicle.power_oil_date || ""} disabled className="bg-gray-50" />
              <Input value={vehicle.power_oil_mileage?.toLocaleString() || ""} disabled className="bg-gray-50" />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>에어드라이어</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.air_dryer_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.airDryer, warnings.airDryer)}`}
              />
              <Input
                value={vehicle.air_dryer_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.airDryer, warnings.airDryer)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>드라이필터</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.dry_filter_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.dryFilter, warnings.dryFilter)}`}
              />
              <Input
                value={vehicle.dry_filter_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.dryFilter, warnings.dryFilter)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>수분분리기</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.water_separator_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.waterSeparator, warnings.waterSeparator)}`}
              />
              <Input
                value={vehicle.water_separator_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.waterSeparator, warnings.waterSeparator)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>라이닝</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.lining_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.lining, warnings.lining)}`}
              />
              <Input
                value={vehicle.lining_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.lining, warnings.lining)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>타이어</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.tire_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.tire, warnings.tire)}`}
              />
              <Input
                value={vehicle.tire_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.tire, warnings.tire)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>배터리</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.battery_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.battery, warnings.battery)}`}
              />
              <Input
                value={vehicle.battery_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.battery, warnings.battery)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>에어탱크</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.air_tank_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.airTank, warnings.airTank)}`}
              />
              <Input
                value={vehicle.air_tank_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.airTank, warnings.airTank)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>축베어링</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.axle_bearing_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.axleBearing, warnings.axleBearing)}`}
              />
              <Input
                value={vehicle.axle_bearing_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.axleBearing, warnings.axleBearing)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>PTO조인트</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.pto_joint_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.ptoJoint, warnings.ptoJoint)}`}
              />
              <Input
                value={vehicle.pto_joint_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.ptoJoint, warnings.ptoJoint)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>PTO펌프</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.pto_pump_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.ptoJump, warnings.ptoJump)}`}
              />
              <Input
                value={vehicle.pto_pump_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.ptoJump, warnings.ptoJump)}`}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>히터</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={vehicle.heater_date || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.heater, warnings.heater)}`}
              />
              <Input
                value={vehicle.heater_mileage?.toLocaleString() || ""}
                disabled
                className={`bg-gray-50 ${getHighlightClass(highlights.heater, warnings.heater)}`}
              />
            </div>
          </div>

          {/* Added "기타" field */}
          <div className="col-span-full md:col-span-1">
            <Label>기타</Label>
            <Input value={vehicle.others_summary || "-"} disabled className="bg-gray-50" />
          </div>

          <div className="col-span-full md:col-span-1">
            <Label>전월 주행거리 (km)</Label>
            <Input value={vehicle.last_monthly_mileage?.toLocaleString() || "0"} disabled className="bg-gray-50" />
          </div>
        </div>
      </CardContent>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>차량 삭제</DialogTitle>
            <DialogDescription>
              해당 차량의 모든 이력이 삭제됩니다. 그래도 삭제하겠습니까?
              <br />
              삭제하려면 로그인 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="delete_username">아이디</Label>
              <Input
                id="delete_username"
                value={deleteUsername}
                onChange={(e) => setDeleteUsername(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="delete_password">비밀번호</Label>
              <Input
                id="delete_password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>차량 기본 정보 수정</DialogTitle>
            <DialogDescription>수정하려면 로그인 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_transporter">Transporter</Label>
                <Input
                  id="edit_transporter"
                  value={editData.transporter}
                  onChange={(e) => setEditData({ ...editData, transporter: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_driver_name">운전원</Label>
                <Input
                  id="edit_driver_name"
                  value={editData.driver_name}
                  onChange={(e) => setEditData({ ...editData, driver_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_vehicle_type">차량 종류</Label>
                <Select
                  value={editData.vehicle_type}
                  onValueChange={(value) => setEditData({ ...editData, vehicle_type: value })}
                >
                  <SelectTrigger id="edit_vehicle_type">
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
                    <SelectItem value="승용차">승용차</SelectItem>
                    <SelectItem value="1톤">1톤</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_manufacturer">제조사</Label>
                <Input
                  id="edit_manufacturer"
                  value={editData.manufacturer}
                  onChange={(e) => setEditData({ ...editData, manufacturer: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_release_date">차량출고일</Label>
                <Input
                  id="edit_release_date"
                  type="date"
                  value={editData.release_date}
                  onChange={(e) => setEditData({ ...editData, release_date: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit_last_inspection_date">정기검사(최근)</Label>
                <Input
                  id="edit_last_inspection_date"
                  type="date"
                  value={editData.last_inspection_date}
                  onChange={(e) => setEditData({ ...editData, last_inspection_date: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit_total_mileage">총주행거리(km)</Label>
                <Input
                  id="edit_total_mileage"
                  type="text"
                  inputMode="numeric"
                  value={formatNumberWithCommas(String(editData.total_mileage || 0))}
                  onChange={(e) => {
                    const rawValue = parseNumberFromFormatted(e.target.value)
                    setEditData({ ...editData, total_mileage: parseInt(rawValue, 10) || 0 })
                  }}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">로그인 정보</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_username">아이디</Label>
                  <Input
                    id="edit_username"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_password">비밀번호</Label>
                  <Input
                    id="edit_password"
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              취소
            </Button>
            <Button onClick={handleEdit} disabled={isEditing}>
              {isEditing ? "수정 중..." : "수정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
