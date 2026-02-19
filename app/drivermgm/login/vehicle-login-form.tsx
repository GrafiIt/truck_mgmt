"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function VehicleLoginForm() {
  const [companyCode, setCompanyCode] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/vehicle-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyCode, username, password }),
      })

      const result = await res.json()

      if (result.success) {
        // 로그인 성공 - 바로 리다이렉트
        window.location.href = "/drivermgm/vehicles"
        return
      } else {
        setError(result.error || "로그인에 실패했습니다.")
        setIsLoading(false)
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="companyCode">기업코드</Label>
        <Input
          id="companyCode"
          type="text"
          value={companyCode}
          onChange={(e) => setCompanyCode(e.target.value)}
          placeholder="기업코드를 입력하세요"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">아이디</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="아이디를 입력하세요"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          required
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>
      )}

      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full font-medium py-2 h-10 text-base" 
          disabled={isLoading}
        >
          {isLoading ? "로그인 중..." : "로그인"}
        </Button>
        <p className="text-center text-black mt-3" style={{ fontSize: "6pt" }}>
          CopyRight 그라피아이티(주) / grafi-it@outlook.kr
        </p>
      </div>
    </form>
  )
}
