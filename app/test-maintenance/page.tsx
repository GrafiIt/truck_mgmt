"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface RawData {
  vehicle: unknown
  fieldHistory: unknown[]
  inspectionHistory: unknown[]
  refuelingHistory: unknown[]
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
      const supabase = createClient()

      // 1) drivermgm.vehicles 에서 차량번호로 id 조회 (회사코드 등 필터 무시)
      const { data: vehicleRow, error: vehicleError } = await supabase
        .schema("drivermgm")
        .from("vehicles")
        .select("*")
        .eq("vehicle_number", trimmed)
        .maybeSingle()

      if (vehicleError) {
        setError(`drivermgm.vehicles 조회 오류: ${vehicleError.message}`)
        setIsLoading(false)
        return
      }

      if (!vehicleRow) {
        setError(`차량번호 "${trimmed}"를 drivermgm.vehicles 테이블에서 찾을 수 없습니다.`)
        setIsLoading(false)
        return
      }

      const vehicleId = (vehicleRow as { id: number | string }).id

      // 2) vehicle_id 기준으로 3개 테이블/뷰에서 시간 역순 조회
      const [fieldRes, inspectionRes, refuelingRes] = await Promise.all([
        // public.vehicle_field_history_human
        supabase
          .from("vehicle_field_history_human")
          .select("*")
          .eq("vehicle_id", vehicleId)
          .order("created_at", { ascending: false }),
        // public.inspection_history_human
        supabase
          .from("inspection_history_human")
          .select("*")
          .eq("vehicle_id", vehicleId)
          .order("created_at", { ascending: false }),
        // drivermgm.refueling_history
        supabase
          .schema("drivermgm")
          .from("refueling_history")
          .select("*")
          .eq("vehicle_id", vehicleId)
          .order("created_at", { ascending: false }),
      ])

      const errors = [
        fieldRes.error && `public.vehicle_field_history_human: ${fieldRes.error.message}`,
        inspectionRes.error && `public.inspection_history_human: ${inspectionRes.error.message}`,
        refuelingRes.error && `drivermgm.refueling_history: ${refuelingRes.error.message}`,
      ].filter(Boolean) as string[]

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

  const preStyle: React.CSSProperties = {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    padding: "1rem",
    overflowX: "auto",
    fontSize: "0.8rem",
    lineHeight: "1.5",
    margin: 0,
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: "1.1rem",
    fontWeight: "bold",
    marginBottom: "0.5rem",
    color: "#1d4ed8",
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
            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) handleSearch()
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

      {isLoading && <p style={{ marginBottom: "1rem", color: "#555" }}>데이터를 불러오는 중입니다...</p>}

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
            <h2 style={sectionTitle}>drivermgm.vehicles (차량 정보)</h2>
            <pre style={preStyle}>
              <code>{JSON.stringify(data.vehicle, null, 2)}</code>
            </pre>
          </section>

          <section>
            <h2 style={sectionTitle}>
              public.vehicle_field_history_human — {data.fieldHistory.length}건
            </h2>
            <pre style={preStyle}>
              <code>{JSON.stringify(data.fieldHistory, null, 2)}</code>
            </pre>
          </section>

          <section>
            <h2 style={sectionTitle}>
              public.inspection_history_human — {data.inspectionHistory.length}건
            </h2>
            <pre style={preStyle}>
              <code>{JSON.stringify(data.inspectionHistory, null, 2)}</code>
            </pre>
          </section>

          <section>
            <h2 style={sectionTitle}>
              drivermgm.refueling_history — {data.refuelingHistory.length}건
            </h2>
            <pre style={preStyle}>
              <code>{JSON.stringify(data.refuelingHistory, null, 2)}</code>
            </pre>
          </section>
        </div>
      )}
    </main>
  )
}
