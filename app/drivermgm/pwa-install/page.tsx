"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Smartphone, Apple, Share, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type PageView = "select" | "ios-guide"

export default function PwaInstallPage() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<PageView>("select")
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // 이미 설치된 경우 deferredPrompt 제거
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
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
        await deferredPrompt.userChoice
        setDeferredPrompt(null)
      } catch (error) {
        console.error("PWA install prompt failed:", error)
      }
    } else {
      // deferredPrompt가 없는 경우 (이미 설치되었거나 지원되지 않는 브라우저)
      alert(
        "이 브라우저에서는 자동 설치가 지원되지 않습니다.\n브라우저 메뉴에서 '홈 화면에 추가' 또는 '앱 설치'를 선택해주세요.",
      )
    }
  }

  const handleIosClick = () => {
    setCurrentView("ios-guide")
  }

  const handleBackToSelect = () => {
    setCurrentView("select")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* 상단 네비게이션 */}
        <div className="flex items-center mb-6">
          {currentView === "ios-guide" ? (
            <button
              onClick={handleBackToSelect}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">기기 선택으로</span>
            </button>
          ) : (
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">이전 화면으로 돌아가기</span>
            </button>
          )}
        </div>

        {/* 콘텐츠 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {currentView === "select" ? (
            <div className="p-6 space-y-4">
              <div className="text-center mb-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">앱 설치하기</h1>
                <p className="text-gray-600 dark:text-gray-300">사용 중인 기기를 선택해주세요</p>
              </div>

              {/* 안드로이드 버튼 */}
              <button
                onClick={handleAndroidInstall}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">안드로이드</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Android 사용자</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* 아이폰 버튼 */}
              <button
                onClick={handleIosClick}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Apple className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">아이폰</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">iOS / iPhone 사용자</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                  <Apple className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">아이폰 설치 안내</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Safari 브라우저에서만 설치할 수 있습니다</p>
              </div>

              {/* 단계별 안내 */}
              <div className="space-y-4">
                {/* 1단계 */}
                <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">Safari로 이 페이지 열기</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Safari 브라우저로 현재 페이지에 접속하세요</p>
                  </div>
                </div>

                {/* 2단계 */}
                <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      공유 버튼 누르기
                      <Share className="w-4 h-4 text-blue-600" />
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      화면 하단의 공유 버튼(사각형에 위 화살표)을 탭하세요
                    </p>
                  </div>
                </div>

                {/* 3단계 */}
                <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      홈 화면에 추가
                      <Plus className="w-4 h-4 text-blue-600" />
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      메뉴에서 &quot;홈 화면에 추가&quot;를 선택하세요
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={() => router.back()} className="w-full" variant="outline">
                확인
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
