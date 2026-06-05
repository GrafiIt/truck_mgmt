"use client"

import { useState, useEffect } from "react"
import { Smartphone } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function PwaInstallButton() {
  const router = useRouter()
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // 서비스 워커 등록
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service Worker registration failed:", error)
      })
    }

    // 이미 설치된 경우 감지
    const handleAppInstalled = () => {
      setIsInstalled(true)
    }

    // standalone 모드로 실행 중인지 확인 (이미 설치됨)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  // 이미 설치된 경우 버튼 숨김
  if (isInstalled) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.push("/drivermgm/pwa-install")}
      title="앱 설치하기"
    >
      <Smartphone className="w-5 h-5" />
    </Button>
  )
}
