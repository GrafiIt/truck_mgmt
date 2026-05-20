"use client"

import { useState, useEffect } from "react"
import { Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import PwaInstallModal from "./PwaInstallModal"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PwaInstallButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // 서비스 워커 등록
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service Worker registration failed:", error)
      })
    }

    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // 이미 설치된 경우 감지
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    // standalone 모드로 실행 중인지 확인 (이미 설치됨)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choiceResult = await deferredPrompt.userChoice
        if (choiceResult.outcome === "accepted") {
          setIsInstalled(true)
        }
        setDeferredPrompt(null)
      } catch (error) {
        console.error("PWA install prompt failed:", error)
      }
    } else {
      // deferredPrompt가 없는 경우 (이미 설치되었거나 지원되지 않는 브라우저)
      alert("이 브라우저에서는 자동 설치가 지원되지 않습니다.\n브라우저 메뉴에서 '홈 화면에 추가' 또는 '앱 설치'를 선택해주세요.")
    }
  }

  // 이미 설치된 경우 버튼 숨김
  if (isInstalled) {
    return null
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsModalOpen(true)}
        title="앱 설치하기"
      >
        <Smartphone className="w-5 h-5" />
      </Button>

      <PwaInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        handleAndroidInstall={handleAndroidInstall}
      />
    </>
  )
}
