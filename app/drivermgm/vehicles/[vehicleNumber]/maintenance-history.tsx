"use client"

import type React from "react"
import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Trash2, Edit2, Download } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatNumberWithCommas, parseNumberFromFormatted } from "@/lib/number-formatter"

const VEHICLE_FIELDS = [
  { value: "all", label: "전체", type: "all" },
  { value: "air_dryer", label: "에어드라이어", type: "date" },
  { value: "air_tank", label: "에어탱크", type: "date" },
  { value: "axle_bearing", label: "축베어링", type: "date" },
  { value: "battery", label: "배터리", type: "both" },
  { value: "defu_oil", label: "데후오일", type: "both" },
  { value: "diesel_filter", label: "경유필터", type: "both" },
  { value: "dry_filter", label: "드라이필터", type: "both" },
  { value: "engine_oil", label: "엔진오일", type: "both" },
  { value: "grease", label: "구리스", type: "both" },
  { value: "heater", label: "히터", type: "date" },
  { value: "inspection", label: "정기점검", type: "inspection" },
  { value: "lining", label: "라이닝", type: "date" },
  { value: "mission_oil", label: "미션오일", type: "both" },
  { value: "monthly_mileage", label: "월간주행거리", type: "monthly_mileage" },
  { value: "others", label: "기타", type: "others" },
  { value: "power_oil", label: "파워오일", type: "both" },
  { value: "pto_joint", label: "PTO조인트", type: "date" },
  { value: "pto_pump", label: "PTO펌프", type: "date" },
  { value: "refueling", label: "주유", type: "refueling" },
  { value: "tire", label: "타이어", type: "both" },
  { value: "water_separator", label: "수분분리기", type: "both" },
]

interface MaintenanceRecord {
  id: number | string
  maintenance_date: string
  field_name: string
  field_label: string
  date_value: string | null
  mileage_value: number | null
  text_value: string | null
  text_value2: string | null
  repair_shop: string | null
  cost: number | null
  created_at: string | null
  type?: "field" | "inspection" // 레코드 타입 추가
  email_1?: string | null // 정기점검 이메일 필드 추가
  email_2?: string | null
  inspection_result?: string | null // 정기점검 결과 추가
  others_summary?: string | null
  inspection_name?: string | null
  fuel_amount?: number | null
  fuel_cost?: number | null
  mileage_month?: string | null
  month_start_mileage?: number | null
  month_end_mileage?: number | null
}

interface MaintenanceHistoryProps {
  vehicleId: number
  vehicleNumber: string
  vehicle: any // Declare vehicle variable
  records: MaintenanceRecord[] // Declare records variable
}

export default function MaintenanceHistory({ vehicleId, vehicleNumber, vehicle, records }: MaintenanceHistoryProps) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedField, setSelectedField] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSearchQuery, setFilterSearchQuery] = useState("")
  const [filterField, setFilterField] = useState("all")
  const [filterPeriod, setFilterPeriod] = useState("year") // 기본값: 최근 1년
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortBy, setSortBy] = useState("maintenance_date") // "maintenance_date" (정비실행일) 또는 "input_date" (입력일자)
  const [contentSearchQuery, setContentSearchQuery] = useState("") // 내용 검색 쿼리
  const [refuelAmount, setRefuelAmount] = useState("")
  const [refuelCost, setRefuelCost] = useState("")
  const [inspectionResult, setInspectionResult] = useState<"합격" | "불합격">("합격")
  const [inspectionNotes, setInspectionNotes] = useState("")
  const [inspectionEmail1, setInspectionEmail1] = useState("") // 정기점검 이메일 담당자 상태 추가
  const [inspectionEmail2, setInspectionEmail2] = useState("")
  const [monthlyMileageYear, setMonthlyMileageYear] = useState("")
  const [firstMileage, setFirstMileage] = useState("")
  const [lastMileage, setLastMileage] = useState("")
  const [repairShop, setRepairShop] = useState("")
  const [cost, setCost] = useState("")
  const [othersSummary, setOthersSummary] = useState("")

  // 숫자 입력 필드 상태 (천단위 콤마용)
  const [refuelMileage, setRefuelMileage] = useState("")
  const [mileageValue, setMileageValue] = useState("")
  const [monthStartMileage, setMonthStartMileage] = useState("")
  const [monthEndMileage, setMonthEndMileage] = useState("")
  const [othersMileage, setOthersMileage] = useState("")
  const [costValue, setCostValue] = useState("")
  const [fuelCostValue, setFuelCostValue] = useState("")

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<(typeof records)[0] | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // 수정 관련 상태
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [recordToEdit, setRecordToEdit] = useState<(typeof records)[0] | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [editError, setEditError] = useState("")
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const RECORDS_PER_PAGE = 15

  const filteredFields = useMemo(() => {
    if (!searchQuery) return VEHICLE_FIELDS
    return VEHICLE_FIELDS.filter((field) => field.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])

  const filteredFieldsForSearch = useMemo(() => {
    if (!filterSearchQuery) return VEHICLE_FIELDS
    return VEHICLE_FIELDS.filter((field) => field.label.toLowerCase().includes(filterSearchQuery.toLowerCase()))
  }, [filterSearchQuery])

  const selectedFieldConfig = VEHICLE_FIELDS.find((f) => f.value === selectedField)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    console.log("[v0] === FORM SUBMIT TRIGGERED ===")
    console.log("[v0] Selected field:", selectedField)

    const formData = new FormData(e.currentTarget)
    
    // 콤마가 제거된 순수 숫자값을 formData에 설정
    if (refuelMileage) formData.set("mileage", refuelMileage)
    if (mileageValue) formData.set("mileage_value", mileageValue)
    if (monthStartMileage) formData.set("month_start_mileage", monthStartMileage)
    if (monthEndMileage) formData.set("month_end_mileage", monthEndMileage)
    if (othersMileage) formData.set("mileage_value", othersMileage)
    if (costValue) formData.set("cost", costValue)
    if (fuelCostValue) formData.set("fuel_cost", fuelCostValue)
    
    // 최신 총주행거리를 데이터베이스에서 조회 (차량상세정보에서 수정된 값 반영)
    const vehicleData = await fetch(`/api/drivermgm/get-vehicle/${vehicleId}`)
      .then((res) => res.json())
      .catch(() => null)
    
    const currentTotalMileage = vehicleData?.vehicle?.total_mileage ?? vehicle.total_mileage ?? 0

    if (selectedField === "others") {
      // 정비실행일
      if (startDate) {
        formData.append("date_value", startDate)
      }
      // 주행거리
      if (firstMileage) {
        formData.append("mileage_value", firstMileage)
      }
      if (othersSummary) {
        formData.append("text_value", othersSummary)
      }
      // 수리업체
      if (repairShop) {
        formData.append("repair_shop", repairShop)
      }
      // 금액
      if (cost) {
        formData.append("cost", cost)
      }
      // 정비 기타 사항
      if (inspectionNotes) {
        formData.append("maintenance_notes", inspectionNotes)
      }
    }

    if (selectedField === "monthly_mileage") {
      const monthStartMileageInput = formData.get("month_start_mileage")
      const monthEndMileageInput = formData.get("month_end_mileage")

      if (!monthStartMileageInput || !monthEndMileageInput) {
        alert("월의 첫 주행거리와 월의 마지막 주행기록을 모두 입력해주세요.")
        return
      }

      const monthStartMileage = Number(monthStartMileageInput)
      const monthEndMileage = Number(monthEndMileageInput)

      if (monthStartMileage >= monthEndMileage) {
        alert("월의 마지막 주행기록은 월의 첫 주행기록보다 커야 합니다.")
        return
      }

      // "입력한 달의 주행거리" 계산 (월의 마지막 주행기록 - 월의 첫 주행거리)
      const monthlyDistance = monthEndMileage - monthStartMileage
      formData.set("monthly_distance", monthlyDistance.toString())

    } else if (selectedField === "refueling") {
      console.log("[v0] Processing refueling record...")
      console.log("[v0] FormData entries:", Array.from(formData.entries()))
      
      // 주유 항목만 기존 총주행거리 검증
      const refuelMileage = formData.get("mileage")
      if (refuelMileage) {
        const inputMileage = Number(refuelMileage)
        console.log("[v0] Validating mileage:", { inputMileage, currentTotalMileage })
        if (inputMileage < currentTotalMileage) {
          alert(`입력한 주행거리(${inputMileage.toLocaleString()} km)가 총주행거리(${currentTotalMileage.toLocaleString()} km)보다 작습니다.\n\n주행거리는 항상 증가해야 합니다. 현재 총주행거리 이상의 값을 입력해주세요.`)
          return
        }
      }
      // 주유 날짜를 maintenance_date로 설정
      const refuelDate = formData.get("refuel_date")
      if (refuelDate) {
        formData.append("maintenance_date", refuelDate)
      }
      console.log("[v0] Refueling formData ready:", Array.from(formData.entries()))
    }
    // 나머지 정비항목은 주행거리 검증 없이 진행

    setIsSaving(true)

    formData.append("vehicle_id", vehicleId.toString())
    formData.append("field_name", selectedField)
    formData.append("field_label", selectedFieldConfig?.label || "")

    console.log("[v0] Submitting maintenance record:", {
      field: selectedField,
      type: selectedFieldConfig?.type,
      ...(selectedField === "others" && { summary: othersSummary }),
    })

    try {
      let result
      if (selectedField === "monthly_mileage") {
        result = await fetch("/api/drivermgm/add-monthly-mileage-record", {
          method: "POST",
          body: formData,
        }).then((response) => response.json())
      } else if (selectedField === "refueling") {
        console.log("[v0] Calling /api/drivermgm/add-refueling-record...")
        result = await fetch("/api/drivermgm/add-refueling-record", {
          method: "POST",
          body: formData,
        }).then((response) => response.json())
        console.log("[v0] Refueling API response:", result)
      } else if (selectedField === "inspection") {
        console.log("[v0] Inspection formData entries:", Array.from(formData.entries()))
        result = await fetch("/api/drivermgm/add-inspection-record", {
          method: "POST",
          body: formData,
        }).then((response) => response.json())
        console.log("[v0] Inspection API result:", result)
      } else {
        result = await fetch("/api/drivermgm/save-maintenance-record", {
          method: "POST",
          body: formData,
        }).then((response) => response.json())
      }

      console.log("[v0] Maintenance record result:", result)

      if (result.success) {
        // 주유 기록인 경우 디버그 정보 표시
        if (selectedField === "refueling" && result.debug) {
          const calc = result.debug.calculation
          let debugMessage = `주유 기록 저장 완료!\n\n`
          debugMessage += `연비: ${result.debug.fuelEfficiency ? result.debug.fuelEfficiency.toFixed(2) + ' km/L' : '계산 안됨'}\n`
          debugMessage += `총주행거리: ${result.debug.totalMileage?.toLocaleString() || '0'} km\n`
          debugMessage += `마지막 주유량: ${result.debug.lastRefuelAmount?.toFixed(2) || '0'} L\n\n`
          
          if (calc) {
            if (calc.skipped) {
              debugMessage += `❌ 계산 건너뜀: ${calc.reason}`
            } else {
              debugMessage += `계산 내역:\n`
              debugMessage += `- 이전 주행거리: ${calc.previousMileage.toLocaleString()} km\n`
              debugMessage += `- 현재 주행거리: ${calc.currentMileage.toLocaleString()} km\n`
              debugMessage += `- 주행한 거리: ${calc.distance.toLocaleString()} km\n`
              debugMessage += `- 이전 주유량 (사용한 연료): ${calc.previousFuelAmount} L\n`
              debugMessage += `- 현재 주유량 (방금 주입): ${calc.currentFuelAmount} L\n`
              debugMessage += `- 계산된 연비: ${calc.efficiency.toFixed(2)} km/L`
            }
          }
          
          alert(debugMessage)
        }
        
        setIsAdding(false)
        setSelectedField("")
        setSearchQuery("")
        setOthersSummary("")
        setInspectionNotes("")
        setInspectionEmail1("")
        setInspectionEmail2("")
        setRepairShop("")
        setCost("")
        setFirstMileage("")
        setRefuelAmount("")
        setRefuelCost("")
        setRefuelMileage("")
        setMileageValue("")
        setMonthStartMileage("")
        setMonthEndMileage("")
        setOthersMileage("")
        setCostValue("")
        setFuelCostValue("")

        setTimeout(() => {
          router.refresh()
        }, 500)
      } else {
        alert(result.error || "저장 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("[v0] Error saving maintenance record:", error)
      alert("저장 중 오류가 발생했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (selectedField === "others" && othersSummary) {
      const koreanChars = (othersSummary.match(/[ㄱ-ㅎ가-힣]/g) || []).length
      const otherChars = othersSummary.length - koreanChars

      if (koreanChars > 40 || otherChars > 60) {
        alert("한줄요약은 한글 40자, 영어 60자를 초과할 수 없습니다.")
        return
      }
    }
  }

  const filteredRecords = useMemo(() => {
    let filtered = records

    // 컬럼 필터링
    if (filterField !== "all") {
      filtered = filtered.filter((record) => record.field_name === filterField)
    }

    // 내용 검색 (컬럼이 선택된 경우에만)
    if (contentSearchQuery && filterField !== "all") {
      const query = contentSearchQuery.toLowerCase()
      filtered = filtered.filter((record) => {
        // 검색 대상 필드 결정
        let searchTargets: string[] = []

        // 컬럼별로 검색 대상 필드 설정
        if (record.field_name === "refueling") {
          // 주유: 수리업체(주유소명), 금액(주유비)
          searchTargets = [
            record.repair_shop || "",
            record.cost ? record.cost.toString() : "",
            record.fuel_amount ? record.fuel_amount.toString() : "",
          ]
        } else if (record.field_name === "inspection") {
          // 정기점검: 담당자, 이메일, 결과, 기타사항
          searchTargets = [
            record.inspection_name || "",
            record.inspection_result || "",
            record.email_1 || "",
            record.email_2 || "",
            record.inspection_notes || "",
          ]
        } else if (record.field_name === "others") {
          // 기타: 한줄요약, 정비 기타 사항
          searchTargets = [record.others_summary || "", record.text_value2 || ""]
        } else if (record.field_name === "monthly_mileage") {
          // 월간주행거리: 주행월, 시작/종료 주행거리
          searchTargets = [
            record.mileage_month || "",
            record.month_start_mileage ? record.month_start_mileage.toString() : "",
            record.month_end_mileage ? record.month_end_mileage.toString() : "",
          ]
        } else {
          // 기��� 정비항목: 수리업체, 금액, 정비 기타 사항
          searchTargets = [
            record.repair_shop || "",
            record.cost ? record.cost.toString() : "",
            record.text_value2 || "",
            record.text_value || "",
          ]
        }

        // 검색 대상 중 하나라도 포함되는지 확인
        return searchTargets.some((target) => target.toLowerCase().includes(query))
      })
    }

    // 기간 필터링 (입력일자 기준: maintenance_date)
    if (filterPeriod !== "all") {
      const now = new Date()
      let startFilterDate: Date | null = null

      if (filterPeriod === "year") {
        startFilterDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      } else if (filterPeriod === "month") {
        startFilterDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      } else if (filterPeriod === "custom") {
        if (startDate) {
          startFilterDate = new Date(startDate)
        }
      }

      filtered = filtered.filter((record) => {
        // 입력일자(maintenance_date) 기준으로 필터링
        const recordDate = new Date(record.maintenance_date)
        
        if (startFilterDate) {
          if (recordDate < startFilterDate) return false
        }
        if (endDate) {
          if (recordDate > new Date(endDate)) return false
        }
        
        return true
      })
    }

    // 정렬 적용
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "maintenance_date") {
        // 정비실행일 기준 정렬 (date_value 사용)
        const dateA = new Date(a.date_value || a.maintenance_date).getTime()
        const dateB = new Date(b.date_value || b.maintenance_date).getTime()
        return dateB - dateA // 최신순
      } else {
        // 입력일자 기준 정렬 (maintenance_date 사용)
        const dateA = new Date(a.maintenance_date).getTime()
        const dateB = new Date(b.maintenance_date).getTime()
        return dateB - dateA // 최신순
      }
    })

    return sorted
  }, [records, filterField, contentSearchQuery, filterPeriod, startDate, endDate, sortBy])

  const handleExcelDownload = useCallback(() => {
    const headers = [
      "입력 일자",
      "정비 항목",
      "정비실행일",
      "주행거리 (km)",
      "수리업체",
      "금액 (원)",
      "정비 기타 사항",
      "주유량 (리터)",
      "주유비 (원)",
      "한줄요약",
      "정기점검명",
      "정기점검결과",
      "담당자 E-mail 1",
      "담당자 E-mail 2",
      "합격/불합격 참고사항",
      "주행월",
      "월의 첫 주행기록 (km)",
      "월의 마지막 주행기록 (km)",
      "입력한 달의 주행거리 (km)",
      "생성일시",
    ]

    const escapeCSV = (value: string | number | null | undefined) => {
      if (value === null || value === undefined) return ""
      const str = String(value)
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = filteredRecords.map((r) => {
      // monthly_mileage 필드는 text_value에 JSON으로 저장됨
      let mileageMonth = ""
      let monthStartMileageVal = ""
      let monthEndMileageVal = ""
      let monthlyDistance = ""
      if (r.field_name === "monthly_mileage" && r.text_value) {
        try {
          const parsed = JSON.parse(r.text_value)
          mileageMonth = parsed.mileage_month || ""
          monthStartMileageVal = parsed.month_start_mileage?.toString() || ""
          monthEndMileageVal = parsed.month_end_mileage?.toString() || ""
          const dist = Number(parsed.month_end_mileage) - Number(parsed.month_start_mileage)
          monthlyDistance = !isNaN(dist) ? dist.toString() : ""
        } catch {}
      }

      return [
        escapeCSV(r.maintenance_date),
        escapeCSV(r.field_label),
        escapeCSV(r.date_value || ""),
        escapeCSV(r.mileage_value ?? ""),
        escapeCSV(r.repair_shop ?? ""),
        escapeCSV(r.cost ?? ""),
        escapeCSV(r.text_value2 ?? ""),
        escapeCSV(r.fuel_amount ?? ""),
        escapeCSV(r.fuel_cost ?? ""),
        escapeCSV(r.others_summary ?? ""),
        escapeCSV(r.inspection_name ?? ""),
        escapeCSV(r.inspection_result ?? ""),
        escapeCSV(r.email_1 ?? ""),
        escapeCSV(r.email_2 ?? ""),
        escapeCSV((r as any).inspection_notes ?? ""),
        escapeCSV(mileageMonth),
        escapeCSV(monthStartMileageVal),
        escapeCSV(monthEndMileageVal),
        escapeCSV(monthlyDistance),
        escapeCSV(r.created_at ?? ""),
      ]
    })

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    link.href = url
    link.download = `정비이력_${vehicleNumber}_${today}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [filteredRecords, vehicleNumber])

  // 페이지네이션된 데이터 계산
  const paginatedRecords = useMemo(() => {
    const startIdx = (currentPage - 1) * RECORDS_PER_PAGE
    const endIdx = startIdx + RECORDS_PER_PAGE
    return filteredRecords.slice(startIdx, endIdx)
  }, [filteredRecords, currentPage, RECORDS_PER_PAGE])

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE)

  const handleDeleteClick = (record: (typeof records)[0]) => {
    setRecordToDelete(record)
    setDeleteModalOpen(true)
    setDeleteError("")
  }

  // 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [filterField, contentSearchQuery, filterPeriod, startDate, endDate, sortBy])

  const handleEditClick = (record: (typeof records)[0]) => {
    setRecordToEdit(record)
    setEditValues({
      date_value: record.date_value || "",
      maintenance_date: record.maintenance_date || "",
      repair_shop: record.repair_shop || "",
      cost: record.cost ? record.cost.toString() : "",
      text_value: record.text_value || "",
      text_value2: record.text_value2 || "",
      inspection_result: record.inspection_result || "",
      inspection_notes: record.inspection_notes || "",
      email_1: record.email_1 || "",
      email_2: record.email_2 || "",
      mileage_value: record.mileage_value ? record.mileage_value.toString() : "",
      // monthly_mileage 전용 필드 (text_value에 JSON으로 저장됨)
      mileage_month: (() => {
        if (record.field_name === "monthly_mileage" && record.text_value) {
          try { return JSON.parse(record.text_value).mileage_month || "" } catch { return "" }
        }
        return ""
      })(),
      month_start_mileage: (() => {
        if (record.field_name === "monthly_mileage" && record.text_value) {
          try { return JSON.parse(record.text_value).month_start_mileage?.toString() || "" } catch { return "" }
        }
        return ""
      })(),
      month_end_mileage: (() => {
        if (record.field_name === "monthly_mileage" && record.text_value) {
          try { return JSON.parse(record.text_value).month_end_mileage?.toString() || "" } catch { return "" }
        }
        return ""
      })(),
      // others 전용: others_summary
      others_summary: record.others_summary || "",
      // refueling 전용: fuel_amount, fuel_cost
      fuel_amount: record.fuel_amount ? record.fuel_amount.toString() : "",
      fuel_cost: record.fuel_cost ? record.fuel_cost.toString() : "",
    })
    setEditModalOpen(true)
    setEditError("")
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return

    setIsDeleting(true)
    setDeleteError("")

    try {
      const formData = new FormData()
      formData.append("recordId", recordToDelete.id.toString())
      formData.append("recordType", recordToDelete.field_name || "")

      const response = await fetch("/api/drivermgm/delete-maintenance-record", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      console.log("[v0] Delete response:", result)

      if (result.success) {
        console.log("[v0] Delete successful, reloading page...")
        setDeleteModalOpen(false)
        setRecordToDelete(null)
        // 약간의 지연 후 새로고침하여 모달이 닫히는 것을 확인
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } else {
        console.log("[v0] Delete failed:", result.error)
        setDeleteError(result.error || "삭제에 실패했습니다.")
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
      setDeleteError("삭제 중 오류가 발생했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>정비 이력</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsAdding(!isAdding)}>
                <Plus className="w-4 h-4 mr-2" />
                {isAdding ? "취소" : "이력 추가"}
              </Button>
              <Button
                variant="outline"
                className="border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-950"
                onClick={handleExcelDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                엑셀다운
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 p-4 border rounded-lg space-y-4 bg-primary/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maintenance_date">입력 일자 *</Label>
                  <Input type="date" id="maintenance_date" name="maintenance_date" required />
                </div>
                <div>
                  <Label htmlFor="field_select">변경할 컬럼 선택 *</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="컬럼 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={selectedField} onValueChange={setSelectedField} required>
                      <SelectTrigger>
                        <SelectValue placeholder="컬럼을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredFields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                        {filteredFields.length === 0 && (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">검색 결과가 없습니다</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedFieldConfig && (
                  <>
                    {selectedFieldConfig.type === "refueling" && (
                      <>
                        <div>
                          <Label htmlFor="refuel_date">주유실행일 *</Label>
                          <Input type="date" id="refuel_date" name="refuel_date" required />
                        </div>
                        <div>
                          <Label htmlFor="mileage">주행거리 (km) *</Label>
                          <Input 
                            type="text"
                            inputMode="numeric"
                            id="mileage" 
                            name="mileage" 
                            value={formatNumberWithCommas(refuelMileage)}
                            onChange={(e) => setRefuelMileage(parseNumberFromFormatted(e.target.value))}
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="fuel_amount">주유량 (리터) *</Label>
                          <Input type="number" step="0.01" id="fuel_amount" name="fuel_amount" required />
                        </div>
                        <div>
                          <Label htmlFor="fuel_cost">주유비 (원) *</Label>
                          <Input 
                            type="text"
                            inputMode="numeric"
                            id="fuel_cost" 
                            name="fuel_cost" 
                            value={formatNumberWithCommas(fuelCostValue)}
                            onChange={(e) => setFuelCostValue(parseNumberFromFormatted(e.target.value))}
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="repair_shop">수리업체</Label>
                          <Input
                            type="text"
                            id="repair_shop"
                            name="repair_shop"
                            placeholder="수리업체명을 입력하세요..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="maintenance_notes_refueling">정비 기타 사항</Label>
                          <Textarea
                            id="maintenance_notes_refueling"
                            name="maintenance_notes"
                            placeholder="정비 관련 기타 사항을 입력하세요..."
                            rows={3}
                          />
                        </div>
                      </>
                    )}
                    {selectedFieldConfig.type === "inspection" && (
                      <>
                        <div>
                          <Label htmlFor="inspection_date">정기점검 수검일 *</Label>
                          <Input type="date" id="inspection_date" name="inspection_date" required />
                        </div>
                        <div>
                          <Label htmlFor="inspection_name">정기점검명 *</Label>
                          <Input type="text" id="inspection_name" name="inspection_name" required />
                        </div>
                        <div>
                          <Label htmlFor="inspection_result">정기점검결과 *</Label>
                          <Select name="inspection_result" required>
                            <SelectTrigger>
                              <SelectValue placeholder="결과 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pass">Pass</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="email_1">담당자 E-mail 1</Label>
                          <Input
                            type="email"
                            id="email_1"
                            name="email_1"
                            placeholder="example@company.com"
                            value={inspectionEmail1}
                            onChange={(e) => setInspectionEmail1(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email_2">담당자 E-mail 2</Label>
                          <Input
                            type="email"
                            id="email_2"
                            name="email_2"
                            placeholder="example@company.com"
                            value={inspectionEmail2}
                            onChange={(e) => setInspectionEmail2(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="repair_shop">수리업체</Label>
                          <Input
                            type="text"
                            id="repair_shop"
                            name="repair_shop"
                            placeholder="수리업체명을 입력하세요..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="cost">금액 (원)</Label>
                          <Input 
                            id="cost" 
                            name="cost" 
                            type="text"
                            inputMode="numeric"
                            value={formatNumberWithCommas(costValue)}
                            onChange={(e) => setCostValue(parseNumberFromFormatted(e.target.value))}
                            placeholder="금액을 입력하세요..." 
                          />
                        </div>
                        <div>
                          <Label htmlFor="maintenance_notes_general">정비 기타 사항</Label>
                          <Textarea
                            id="maintenance_notes_general"
                            name="maintenance_notes"
                            placeholder="정비 관련 기타 사항을 입력하세요..."
                            rows={3}
                          />
                        </div>
                      </>
                    )}
                    {selectedFieldConfig.type === "text" && (
                      <div className="md:col-span-2">
                        <Label htmlFor="text_value">값</Label>
                        <Input type="text" id="text_value" name="text_value" required />
                      </div>
                    )}
                    {selectedFieldConfig.type === "number" && (
                      <div className="md:col-span-2">
                        <Label htmlFor="mileage_value">주행거리 (km)</Label>
                        <Input type="number" id="mileage_value" name="mileage_value" required />
                      </div>
                    )}
                    {selectedFieldConfig.type === "date" && (
                      <div className="md:col-span-2">
                        <Label htmlFor="date_value">정비실행일</Label>
                        <Input type="date" id="date_value" name="date_value" required />
                      </div>
                    )}
                    {selectedFieldConfig.type === "both" && (
                      <>
                        <div>
                          <Label htmlFor="date_value">정비실행일</Label>
                          <Input type="date" id="date_value" name="date_value" />
                        </div>
                        <div>
                          <Label htmlFor="mileage_value">주행거리 (km)</Label>
                          <Input 
                            type="text"
                            inputMode="numeric"
                            id="mileage_value" 
                            name="mileage_value" 
                            value={formatNumberWithCommas(mileageValue)}
                            onChange={(e) => setMileageValue(parseNumberFromFormatted(e.target.value))}
                          />
                        </div>
                      </>
                    )}
                    {(selectedFieldConfig.type === "both" || selectedFieldConfig.type === "date") && (
                      <>
                        <div>
                          <Label htmlFor="repair_shop">수리업체</Label>
                          <Input
                            type="text"
                            id="repair_shop"
                            name="repair_shop"
                            placeholder="수리업체명을 입력하세요..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="cost">금액 (원)</Label>
                          <Input 
                            id="cost" 
                            name="cost" 
                            type="text"
                            inputMode="numeric"
                            value={formatNumberWithCommas(costValue)}
                            onChange={(e) => setCostValue(parseNumberFromFormatted(e.target.value))}
                            placeholder="금액을 입력하세요..." 
                          />
                        </div>
                        <div>
                          <Label htmlFor="maintenance_notes_general">정비 기타 사항</Label>
                          <Textarea
                            id="maintenance_notes_general"
                            name="maintenance_notes"
                            placeholder="정비 관련 기타 사항을 입력하세요..."
                            rows={3}
                          />
                        </div>
                      </>
                    )}
                    {selectedFieldConfig.type === "monthly_mileage" && (
                      <>
                        <div>
                          <Label htmlFor="mileage_month">주행월 (YYYY-MM) *</Label>
                          <Input
                            id="mileage_month"
                            name="mileage_month"
                            type="month"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="month_start_mileage">월의 첫 주행거리 (km) *</Label>
                          <Input
                            id="month_start_mileage"
                            name="month_start_mileage"
                            type="text"
                            inputMode="numeric"
                            value={formatNumberWithCommas(monthStartMileage)}
                            placeholder="월의 첫 주행거리를 입력하세요..."
                            required
                            onChange={(e) => {
                              const rawValue = parseNumberFromFormatted(e.target.value)
                              setMonthStartMileage(rawValue)
                              const start = Number(rawValue)
                              if (monthEndMileage) {
                                const end = Number(monthEndMileage)
                                const distanceInput = document.getElementById("calculated_monthly_distance") as HTMLInputElement
                                if (distanceInput) {
                                  distanceInput.value = end > start ? formatNumberWithCommas(String(end - start)) : "0"
                                }
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="month_end_mileage">월의 마지막 주행기록 (km) *</Label>
                          <Input
                            id="month_end_mileage"
                            name="month_end_mileage"
                            type="text"
                            inputMode="numeric"
                            value={formatNumberWithCommas(monthEndMileage)}
                            placeholder="월의 마지막 주행기록을 입력하세요..."
                            required
                            onChange={(e) => {
                              const rawValue = parseNumberFromFormatted(e.target.value)
                              setMonthEndMileage(rawValue)
                              const end = Number(rawValue)
                              if (monthStartMileage) {
                                const start = Number(monthStartMileage)
                                const distanceInput = document.getElementById("calculated_monthly_distance") as HTMLInputElement
                                if (distanceInput) {
                                  distanceInput.value = end > start ? formatNumberWithCommas(String(end - start)) : "0"
                                }
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="calculated_monthly_distance">입력한 달의 주행거리 (km)</Label>
                          <Input
                            id="calculated_monthly_distance"
                            type="text"
                            placeholder="자동 계산됩니다"
                            readOnly
                            className="bg-muted"
                          />
                        </div>
                      </>
                    )}
                    {selectedFieldConfig.type === "others" && (
                      <>
                        <div>
                          <Label htmlFor="date">정비실행일 *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="mileage">주행거리(km)</Label>
                          <Input
                            id="mileage"
                            type="text"
                            inputMode="numeric"
                            value={formatNumberWithCommas(othersMileage)}
                            onChange={(e) => setOthersMileage(parseNumberFromFormatted(e.target.value))}
                            placeholder="주행거리 입력"
                          />
                        </div>

                        <div>
                          <Label htmlFor="othersSummary">한줄요약 (한글 40자/영어 60자 제한)</Label>
                          <Input
                            id="othersSummary"
                            type="text"
                            value={othersSummary}
                            onChange={(e) => {
                              const value = e.target.value
                              const koreanChars = (value.match(/[ㄱ-ㅎ가-힣]/g) || []).length
                              const otherChars = value.length - koreanChars

                              if (koreanChars <= 40 && otherChars <= 60) {
                                setOthersSummary(value)
                              } else {
                                alert("한줄요약은 한글 40자, 영어 60자를 초과할 수 없습니다.")
                              }
                            }}
                            placeholder="예: 엔진 점검 및 수리"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            현재: {othersSummary.match(/[ㄱ-ㅎ가-힣]/g)?.length || 0}자 (한글) /{" "}
                            {othersSummary.length - (othersSummary.match(/[ㄱ-ㅎ가-힣]/g)?.length || 0)}자 (기타)
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="repair_shop_others">수리업체</Label>
                          <Input
                            id="repair_shop_others"
                            name="repair_shop"
                            type="text"
                            placeholder="수리업체명을 입력하세요..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="cost_others">금액 (원)</Label>
                          <Input 
                            id="cost_others" 
                            name="cost" 
                            type="text"
                            inputMode="numeric"
                            value={formatNumberWithCommas(costValue)}
                            onChange={(e) => setCostValue(parseNumberFromFormatted(e.target.value))}
                            placeholder="금액을 입력하세요..." 
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maintenance_notes_others">정비 기타 사항</Label>
                          <Textarea
                            id="maintenance_notes_others"
                            name="maintenance_notes"
                            value={inspectionNotes}
                            onChange={(e) => setInspectionNotes(e.target.value)}
                            placeholder="정비 관련 기타 사항을 입력하세요..."
                            rows={3}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving || !selectedField}>
                  {isSaving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </form>
          )}

          <div className="mb-4 p-4 border rounded-lg bg-muted">
            <h3 className="font-semibold mb-3">이력 검색 및 정렬</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filter_field">컬럼</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="검색할 컬럼..."
                      value={filterSearchQuery}
                      onChange={(e) => setFilterSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterField} onValueChange={setFilterField}>
                    <SelectTrigger>
                      <SelectValue placeholder="컬럼 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredFieldsForSearch.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                      {filteredFieldsForSearch.length === 0 && (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">검색 결과가 없습니다</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="filter_period">기간</Label>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="year">최근 1년</SelectItem>
                    <SelectItem value="month">최근 1개월</SelectItem>
                    <SelectItem value="custom">사용자 지정</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort_by">정렬기준</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance_date">정비실행일</SelectItem>
                    <SelectItem value="input_date">입력일자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filterPeriod === "custom" && (
                <>
                  <div>
                    <Label htmlFor="start_date">시작일</Label>
                    <Input
                      type="date"
                      id="start_date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">종료일</Label>
                    <Input type="date" id="end_date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </>
              )}
              {filterField !== "" && filterField !== "all" && (
                <div>
                  <Label htmlFor="content_search">내용 검색</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      id="content_search"
                      placeholder={`${VEHICLE_FIELDS.find((f) => f.value === filterField)?.label || ""} 항목 검색...`}
                      value={contentSearchQuery}
                      onChange={(e) => setContentSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 필터링된 이력 표시 */}
          <div className="overflow-x-scroll" style={{ scrollbarWidth: 'thin' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">입력 일자</TableHead>
                  <TableHead className="whitespace-nowrap">정비 항목</TableHead>
                  <TableHead className="whitespace-nowrap">정비실행일</TableHead>
                  <TableHead className="whitespace-nowrap">주행거리 (km)</TableHead>
                  <TableHead className="whitespace-nowrap">수리업체</TableHead>
                  <TableHead className="whitespace-nowrap">금액 (원)</TableHead>
                  <TableHead className="whitespace-nowrap">정비 기타 사항</TableHead>
                  <TableHead className="whitespace-nowrap">주유량 (리터)</TableHead>
                  <TableHead className="whitespace-nowrap">주유비 (원)</TableHead>
                  <TableHead className="whitespace-nowrap">한줄요약</TableHead>
                  <TableHead className="whitespace-nowrap">정기점검명</TableHead>
                  <TableHead className="whitespace-nowrap">정기점검결과</TableHead>
                  <TableHead className="whitespace-nowrap">담당자 E-mail 1</TableHead>
                  <TableHead className="whitespace-nowrap">담당자 E-mail 2</TableHead>
                  <TableHead className="whitespace-nowrap">합격/불합격 참고사항</TableHead>
                  <TableHead className="whitespace-nowrap">주행월</TableHead>
                  <TableHead className="whitespace-nowrap">월의 첫 주행기록 (km)</TableHead>
                  <TableHead className="whitespace-nowrap">월의 마지막 주행기록 (km)</TableHead>
                  <TableHead className="whitespace-nowrap">입력한 달의 주행거리 (km)</TableHead>
                  <TableHead className="whitespace-nowrap">생성일시</TableHead>
                  <TableHead className="whitespace-nowrap text-center">삭제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={21} className="text-center text-muted-foreground py-8">
                      정비 이력이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((record) => (
                    <TableRow key={`${record.field_name || 'unknown'}-${record.id}`}>
                      <TableCell className="whitespace-nowrap">
                        {record.maintenance_date ? new Date(record.maintenance_date).toLocaleDateString("ko-KR") : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{record.field_label || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.date_value ? new Date(record.date_value).toLocaleDateString("ko-KR") : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.mileage_value != null ? record.mileage_value.toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{record.repair_shop || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name !== "refueling" && record.cost != null
                          ? `${record.cost.toLocaleString()}원`
                          : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "inspection" ? "-" : record.text_value2 || "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "refueling" && record.fuel_amount ? `${record.fuel_amount}L` : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "refueling" && record.fuel_cost
                          ? `${record.fuel_cost.toLocaleString()}원`
                          : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "others" ? record.others_summary || "-" : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "inspection" ? record.inspection_name || "-" : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "inspection" ? record.inspection_result || "-" : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "inspection" ? record.email_1 || "-" : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "inspection" ? record.email_2 || "-" : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "inspection" ? record.inspection_notes || "-" : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "monthly_mileage" && record.text_value
                          ? (() => {
                              try {
                                const data = JSON.parse(record.text_value)
                                return data.mileage_month || "-"
                              } catch {
                                return "-"
                              }
                            })()
                          : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "monthly_mileage" && record.text_value
                          ? (() => {
                              try {
                                const data = JSON.parse(record.text_value)
                                return data.month_start_mileage ? `${Number(data.month_start_mileage).toLocaleString()}km` : "-"
                              } catch {
                                return "-"
                              }
                            })()
                          : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "monthly_mileage" && record.text_value
                          ? (() => {
                              try {
                                const data = JSON.parse(record.text_value)
                                return data.month_end_mileage ? `${Number(data.month_end_mileage).toLocaleString()}km` : "-"
                              } catch {
                                return "-"
                              }
                            })()
                          : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.field_name === "monthly_mileage" && record.mileage_value
                          ? `${record.mileage_value.toLocaleString()}km`
                          : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {record.created_at ? new Date(record.created_at).toLocaleString("ko-KR") : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(record)}
                            className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(record)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                이전
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 모달 */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정비 이력 삭제</DialogTitle>
            <DialogDescription>정비 이력을 삭제하시겠습니까?</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {deleteError && (
              <Alert variant="destructive">
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}

            {recordToDelete && (
              <div className="text-sm text-foreground bg-muted p-3 rounded">
                <p>
                  <strong>정비 항목:</strong> {recordToDelete.field_label}
                </p>
                <p>
                  <strong>정비실행일:</strong>{" "}
                  {recordToDelete.date_value ? new Date(recordToDelete.date_value).toLocaleDateString("ko-KR") : "-"}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 모달 */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>정비 이력 수정</DialogTitle>
            <DialogDescription>{recordToEdit?.field_label} 항목 수정</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editError && (
              <Alert variant="destructive">
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}

            {recordToEdit && (
              <>
                <div className="space-y-2">
                  <Label>정비 항목</Label>
                  <div className="p-2 bg-muted rounded text-sm">{recordToEdit.field_label}</div>
                </div>

                {/* === type: "date" 항목 (에어드라이어, 에어탱크, 축베어링, 히터, 라이닝, PTO조인트, PTO펌프) === */}
                {(() => {
                  const fieldConfig = VEHICLE_FIELDS.find(f => f.value === recordToEdit.field_name)
                  const fieldType = fieldConfig?.type
                  return fieldType === "date"
                })() && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-date">정비실행일</Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={editValues.date_value || ""}
                        onChange={(e) => setEditValues({ ...editValues, date_value: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-repair-shop">수리업체</Label>
                        <Input
                          id="edit-repair-shop"
                          value={editValues.repair_shop || ""}
                          onChange={(e) => setEditValues({ ...editValues, repair_shop: e.target.value })}
                          placeholder="수리업체명"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-cost">금액 (원)</Label>
                        <Input
                          id="edit-cost"
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(editValues.cost || "")}
                          onChange={(e) => setEditValues({ ...editValues, cost: parseNumberFromFormatted(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-notes">정비 기타 사항</Label>
                      <Textarea
                        id="edit-notes"
                        value={editValues.text_value2 || ""}
                        onChange={(e) => setEditValues({ ...editValues, text_value2: e.target.value })}
                        placeholder="정��� 기타 사항을 입력하세요"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {/* === type: "both" 항목 (배터리, 데후오일, 경유필터, 드라이필터, 엔진오일, 구리스, 미션오일, 파워오일, 타이어, 수분분리기) === */}
                {(() => {
                  const fieldConfig = VEHICLE_FIELDS.find(f => f.value === recordToEdit.field_name)
                  const fieldType = fieldConfig?.type
                  return fieldType === "both"
                })() && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-date">정비실행일</Label>
                        <Input
                          id="edit-date"
                          type="date"
                          value={editValues.date_value || ""}
                          onChange={(e) => setEditValues({ ...editValues, date_value: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-mileage-both">주행거리 (km)</Label>
                        <Input
                          id="edit-mileage-both"
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(editValues.mileage_value || "")}
                          onChange={(e) => setEditValues({ ...editValues, mileage_value: parseNumberFromFormatted(e.target.value) })}
                          placeholder="주행거리"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-repair-shop">수리업체</Label>
                        <Input
                          id="edit-repair-shop"
                          value={editValues.repair_shop || ""}
                          onChange={(e) => setEditValues({ ...editValues, repair_shop: e.target.value })}
                          placeholder="수리업체명"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-cost">금액 (원)</Label>
                        <Input
                          id="edit-cost"
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(editValues.cost || "")}
                          onChange={(e) => setEditValues({ ...editValues, cost: parseNumberFromFormatted(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-notes">정비 기타 사항</Label>
                      <Textarea
                        id="edit-notes"
                        value={editValues.text_value2 || ""}
                        onChange={(e) => setEditValues({ ...editValues, text_value2: e.target.value })}
                        placeholder="정비 기타 사항을 입력하세요"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {/* === type: "inspection" (정기점검) === */}
                {recordToEdit.field_name === "inspection" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-date">수검일</Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={editValues.date_value || ""}
                        onChange={(e) => setEditValues({ ...editValues, date_value: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-inspection-name">정기점검명</Label>
                      <Input
                        id="edit-inspection-name"
                        value={editValues.text_value || ""}
                        onChange={(e) => setEditValues({ ...editValues, text_value: e.target.value })}
                        placeholder="정기점검명 (예: 3개월점검)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-inspection-result">정기점검 결과</Label>
                      <Select
                        value={editValues.inspection_result || "합격"}
                        onValueChange={(value) =>
                          setEditValues({ ...editValues, inspection_result: value })
                        }
                      >
                        <SelectTrigger id="edit-inspection-result">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="합격">합격</SelectItem>
                          <SelectItem value="불합격">불합격</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-email1">담당자 E-mail 1</Label>
                        <Input
                          id="edit-email1"
                          type="email"
                          value={editValues.email_1 || ""}
                          onChange={(e) => setEditValues({ ...editValues, email_1: e.target.value })}
                          placeholder="이메일 주소"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email2">담당자 E-mail 2</Label>
                        <Input
                          id="edit-email2"
                          type="email"
                          value={editValues.email_2 || ""}
                          onChange={(e) => setEditValues({ ...editValues, email_2: e.target.value })}
                          placeholder="이메일 주소"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-repair-shop-inspection">수리업체</Label>
                        <Input
                          id="edit-repair-shop-inspection"
                          value={editValues.repair_shop || ""}
                          onChange={(e) => setEditValues({ ...editValues, repair_shop: e.target.value })}
                          placeholder="수리업체명"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-cost-inspection">금액 (원)</Label>
                        <Input
                          id="edit-cost-inspection"
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(editValues.cost || "")}
                          onChange={(e) => setEditValues({ ...editValues, cost: parseNumberFromFormatted(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-inspection-notes">점검 참고사항</Label>
                      <Textarea
                        id="edit-inspection-notes"
                        value={editValues.inspection_notes || ""}
                        onChange={(e) =>
                          setEditValues({ ...editValues, inspection_notes: e.target.value })
                        }
                        placeholder="점검 참고사항을 입력하세요"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {/* === type: "refueling" (주유) === */}
                {recordToEdit.field_name === "refueling" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-date">주유실행일</Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={editValues.date_value || ""}
                        onChange={(e) => setEditValues({ ...editValues, date_value: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-mileage">주행거리 (km)</Label>
                      <Input
                        id="edit-mileage"
                        type="text"
                        inputMode="numeric"
                        value={formatNumberWithCommas(editValues.mileage_value || "")}
                        onChange={(e) => setEditValues({ ...editValues, mileage_value: parseNumberFromFormatted(e.target.value) })}
                        placeholder="주행거리"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-fuel-amount">주유량 (L)</Label>
                        <Input
                          id="edit-fuel-amount"
                          type="number"
                          step="0.1"
                          value={editValues.fuel_amount || ""}
                          onChange={(e) => setEditValues({ ...editValues, fuel_amount: e.target.value })}
                          placeholder="주유량"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-fuel-cost">주유비 (원)</Label>
                        <Input
                          id="edit-fuel-cost"
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(editValues.fuel_cost || "")}
                          onChange={(e) => setEditValues({ ...editValues, fuel_cost: parseNumberFromFormatted(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-repair-shop-fuel">주유소명</Label>
                      <Input
                        id="edit-repair-shop-fuel"
                        value={editValues.repair_shop || ""}
                        onChange={(e) => setEditValues({ ...editValues, repair_shop: e.target.value })}
                        placeholder="주유소명"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-notes-fuel">정비 기타 사항</Label>
                      <Textarea
                        id="edit-notes-fuel"
                        value={editValues.text_value2 || ""}
                        onChange={(e) => setEditValues({ ...editValues, text_value2: e.target.value })}
                        placeholder="정�� 기타 사항을 입력하세요"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {/* === type: "others" (기타) === */}
                {recordToEdit.field_name === "others" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-date">정비실행일</Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={editValues.date_value || ""}
                        onChange={(e) => setEditValues({ ...editValues, date_value: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-mileage-others">주행거리 (km)</Label>
                      <Input
                        id="edit-mileage-others"
                        type="text"
                        inputMode="numeric"
                        value={formatNumberWithCommas(editValues.mileage_value || "")}
                        onChange={(e) => setEditValues({ ...editValues, mileage_value: parseNumberFromFormatted(e.target.value) })}
                        placeholder="주행거리"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-others-summary">한줄요약</Label>
                      <Input
                        id="edit-others-summary"
                        value={editValues.others_summary || ""}
                        onChange={(e) => {
                          const value = e.target.value
                          const koreanChars = (value.match(/[ㄱ-ㅎ가-힣]/g) || []).length
                          const otherChars = value.length - koreanChars
                          if (koreanChars <= 40 && otherChars <= 60) {
                            setEditValues({ ...editValues, others_summary: value })
                          }
                        }}
                        placeholder="예: 엔진 점검 및 수리"
                      />
                      <p className="text-xs text-muted-foreground">
                        {'현재: '}{(editValues.others_summary || "").match(/[ㄱ-ㅎ가-힣]/g)?.length || 0}{'자 (한글) / '}
                        {(editValues.others_summary || "").length - ((editValues.others_summary || "").match(/[ㄱ-ㅎ가-힣]/g)?.length || 0)}{'자 (기타)'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-repair-shop">수리업체</Label>
                        <Input
                          id="edit-repair-shop"
                          value={editValues.repair_shop || ""}
                          onChange={(e) => setEditValues({ ...editValues, repair_shop: e.target.value })}
                          placeholder="수리업체명"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-cost">금액 (원)</Label>
                        <Input
                          id="edit-cost"
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(editValues.cost || "")}
                          onChange={(e) => setEditValues({ ...editValues, cost: parseNumberFromFormatted(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-notes">정비 기타 사항</Label>
                      <Textarea
                        id="edit-notes"
                        value={editValues.text_value2 || ""}
                        onChange={(e) => setEditValues({ ...editValues, text_value2: e.target.value })}
                        placeholder="정비 기타 사항을 입력하세요"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {/* === type: "monthly_mileage" (월간주행거리) === */}
                {recordToEdit.field_name === "monthly_mileage" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-mileage-month">주행월 (YYYY-MM)</Label>
                      <Input
                        id="edit-mileage-month"
                        type="month"
                        value={editValues.mileage_month || ""}
                        onChange={(e) => setEditValues({ ...editValues, mileage_month: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-month-start">월의 첫 주행���리 (km)</Label>
                        <Input
                          id="edit-month-start"
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(editValues.month_start_mileage || "")}
                          onChange={(e) => {
                            const raw = parseNumberFromFormatted(e.target.value)
                            setEditValues({ ...editValues, month_start_mileage: raw })
                          }}
                          placeholder="월의 �� 주행거리"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-month-end">월의 마지막 주행기록 (km)</Label>
                        <Input
                          id="edit-month-end"
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(editValues.month_end_mileage || "")}
                          onChange={(e) => {
                            const raw = parseNumberFromFormatted(e.target.value)
                            setEditValues({ ...editValues, month_end_mileage: raw })
                          }}
                          placeholder="월의 마지막 주행기록"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>입력한 달의 주행거리 (km)</Label>
                      <Input
                        type="text"
                        value={(() => {
                          const start = Number(editValues.month_start_mileage || 0)
                          const end = Number(editValues.month_end_mileage || 0)
                          return end > start ? formatNumberWithCommas(String(end - start)) : "0"
                        })()}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={isUpdating}>
              취소
            </Button>
            <Button onClick={async () => {
              if (!recordToEdit) return
              setIsUpdating(true)
              setEditError("")
              try {
                console.log("[v0] Updating record:", recordToEdit.id, editValues)
                
                const fieldConfig = VEHICLE_FIELDS.find(f => f.value === recordToEdit.field_name)
                const fieldType = fieldConfig?.type

                const updatePayload: any = {
                  id: recordToEdit.id,
                  vehicle_id: vehicleId,
                  field_name: recordToEdit.field_name,
                  date_value: editValues.date_value || null,
                  maintenance_date: editValues.maintenance_date || editValues.date_value || null,
                  repair_shop: editValues.repair_shop || null,
                  cost: editValues.cost ? parseInt(editValues.cost, 10) : null,
                  text_value: editValues.text_value || null,
                  text_value2: editValues.text_value2 || null,
                }

                // "both" type: mileage_value 포함
                if (fieldType === "both") {
                  updatePayload.mileage_value = editValues.mileage_value ? parseInt(editValues.mileage_value, 10) : null
                }

                // 주유 기록: fuel_amount(주유량), fuel_cost(주유비), mileage_value(주행거리)
                if (recordToEdit.field_name === "refueling") {
                  updatePayload.fuel_amount = editValues.fuel_amount ? parseFloat(editValues.fuel_amount) : null
                  updatePayload.fuel_cost = editValues.fuel_cost ? parseInt(editValues.fuel_cost, 10) : null
                  updatePayload.mileage_value = editValues.mileage_value ? parseInt(editValues.mileage_value, 10) : null
                }

                // 기타 항목: mileage_value + others_summary
                if (recordToEdit.field_name === "others") {
                  updatePayload.mileage_value = editValues.mileage_value ? parseInt(editValues.mileage_value, 10) : null
                  updatePayload.others_summary = editValues.others_summary || null
                }

                // 정기점검: inspection 전용 필드
                if (recordToEdit.field_name === "inspection") {
                  updatePayload.inspection_result = editValues.inspection_result || null
                  updatePayload.inspection_notes = editValues.inspection_notes || null
                  updatePayload.email_1 = editValues.email_1 || null
                  updatePayload.email_2 = editValues.email_2 || null
                }

                // 월간주행거리: text_value에 JSON, mileage_value에 계산된 월간거리
                if (recordToEdit.field_name === "monthly_mileage") {
                  const monthStart = Number(editValues.month_start_mileage || 0)
                  const monthEnd = Number(editValues.month_end_mileage || 0)
                  if (monthStart > 0 && monthEnd > 0 && monthStart >= monthEnd) {
                    setEditError("월의 마지막 주행기록은 월의 첫 주행기록보다 커야 합니다.")
                    setIsUpdating(false)
                    return
                  }
                  const monthlyDistance = monthEnd > monthStart ? monthEnd - monthStart : 0
                  updatePayload.text_value = JSON.stringify({
                    mileage_month: editValues.mileage_month || null,
                    month_start_mileage: monthStart || null,
                    month_end_mileage: monthEnd || null,
                  })
                  updatePayload.mileage_value = monthlyDistance || null
                  updatePayload.mileage_month = editValues.mileage_month || null
                  updatePayload.month_start_mileage = monthStart || null
                  updatePayload.month_end_mileage = monthEnd || null
                }

                console.log("[v0] Update payload:", updatePayload)

                const response = await fetch("/api/drivermgm/update-maintenance-record", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updatePayload),
                })

                if (!response.ok) {
                  const error = await response.json()
                  throw new Error(error.error || "업데이트 중 오류가 발생했습니다.")
                }

                console.log("[v0] Update successful")
                setEditModalOpen(false)
                setTimeout(() => {
                  router.refresh()
                }, 100)
              } catch (error) {
                console.error("[v0] Update error:", error)
                setEditError(error instanceof Error ? error.message : "수정 중 오류가 발생했습니다.")
              } finally {
                setIsUpdating(false)
              }
            }} disabled={isUpdating}>
              {isUpdating ? "수정 중..." : "수정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
