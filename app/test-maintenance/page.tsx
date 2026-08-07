"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface RawData {
  vehicle: object | null
  fieldHistory: object[]
  inspectionHistory: object[]
  refuelingHistory: object[]
}

export default function TestMaintenancePage() {
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<RawData | null>(null)

  const handleSearch = async () => {
    const trimmed = vehicleNumber.trim()
    if (!trimmed) {
      setError("차량번호를 입력해주세요.")
      return
    }

    setIsLoading(true)
    setError(null)
    setData(null)

    try {
      // 1) vehicles_human 에서 id 조회
      const { data: vehicleRow, error: vehicleError } = await supabase
        .from("vehicles_human")
        .select("*")
        .eq("vehicle_number", trimmed)
        .maybeSingle()

      if (vehicleError) {
        setError(`vehicles_human 조회 오류: ${vehicleError.message}`)
        setIsLoading(false)
        return
      }

      if (!vehicleRow) {
        setError(`차량번호 "${trimmed}"를 vehicles_human 테이블에서 찾을 수 없습니다.`)
        setIsLoading(false)
        return
      }

      const vehicleId = vehicleRow.id

      // 2) 3개 테이블에서 데이터 병렬 조회 (시간 역순)
      const [fieldRes, inspectionRes, refuelingRes] = await Promise.all([
        supabase
          .from("vehicle_field_history_human")
          .select("*")
          .eq("vehicle_id", vehicleId)
          .order("created_at", { ascending: false }),
        supabase
          .from("inspection_history_human")
          .select("*")
          .eq("vehicle_id", vehicleId)
          .order("created_at", { ascending: false }),
        supabase
          .from("refueling_history")
          .select("*")
          .eq("vehicle_id", vehicleId)
          .order("created_at", { ascending: false }),
      ])

      const errors = [
        fieldRes.error && `vehicle_field_history_human: ${fieldRes.error.message}`,
        inspectionRes.error && `inspection_history_human: ${inspectionRes.error.message}`,
        refuelingRes.error && `refueling_history: ${refuelingRes.error.message}`,
      ].filter(Boolean)

      if (errors.length > 0) {
        setError(errors.join("\n"))
      }

      setData({
        vehicle: vehicleRow,
        fieldHistory: fieldRes.data ?? [],
        inspectionHistory: inspectionRes.data ?? [],
        refuelingHistory: refuelingRes.data ?? [],
      })
    } catch (err) {
      setError(`예기치 못한 오류: ${String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
        [진단] 정비 이력 Raw Data 조회
      </h1>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSearch()
          }}
          placeholder="차량번호 입력 (예: 12가3456)"
          style={{
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "1rem",
            width: "280px",
          }}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          style={{
            padding: "0.5rem 1.25rem",
            backgroundColor: isLoading ? "#888" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "1rem",
          }}
        >
          {isLoading ? "조회 중..." : "검색"}
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #f87171",
            borderRadius: "4px",
            padding: "0.75rem 1rem",
            color: "#b91c1c",
            marginBottom: "1.5rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      )}

      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <section>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem", color: "#1d4ed8" }}>
              vehicles_human (차량 정보)
            </h2>
            <pre
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "4px",
                padding: "1rem",
                overflowX: "auto",
                fontSize: "0.8rem",
                lineHeight: "1.5",
              }}
            >
              {JSON.stringify(data.vehicle, null, 2)}
            </pre>
          </section>

          <section>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem", color: "#1d4ed8" }}>
              vehicle_field_history_human (일반 정비 이력) — {data.fieldHistory.length}건
            </h2>
            <pre
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "4px",
                padding: "1rem",
                overflowX: "auto",
                fontSize: "0.8rem",
                lineHeight: "1.5",
              }}
            >
              {JSON.stringify(data.fieldHistory, null, 2)}
            </pre>
          </section>

          <section>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem", color: "#1d4ed8" }}>
              inspection_history_human (정기점검 이력) — {data.inspectionHistory.length}건
            </h2>
            <pre
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "4px",
                padding: "1rem",
                overflowX: "auto",
                fontSize: "0.8rem",
                lineHeight: "1.5",
              }}
            >
              {JSON.stringify(data.inspectionHistory, null, 2)}
            </pre>
          </section>

          <section>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem", color: "#1d4ed8" }}>
              refueling_history (주유 이력) — {data.refuelingHistory.length}건
            </h2>
            <pre
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "4px",
                padding: "1rem",
                overflowX: "auto",
                fontSize: "0.8rem",
                lineHeight: "1.5",
              }}
            >
              {JSON.stringify(data.refuelingHistory, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </main>
  )
}
