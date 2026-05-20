"use client"

import { useState } from "react"
import { X, ArrowLeft, Smartphone, Apple, Share, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PwaInstallModalProps {
  isOpen: boolean
  onClose: () => void
  handleAndroidInstall: () => void
}

type ModalView = "select" | "ios-guide"

export default function PwaInstallModal({
  isOpen,
  onClose,
  handleAndroidInstall,
}: PwaInstallModalProps) {
  const [currentView, setCurrentView] = useState<ModalView>("select")

  if (!isOpen) return null

  const handleAndroidClick = () => {
    handleAndroidInstall()
    onClose()
  }

  const handleIosClick = () => {
    setCurrentView("ios-guide")
  }

  const handleBack = () => {
    setCurrentView("select")
  }

  const handleClose = () => {
    setCurrentView("select")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 모달 컨테이너 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          {currentView === "ios-guide" ? (
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span className="text-sm">뒤로</span>
            </button>
          ) : (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              앱 설치하기
            </h2>
          )}
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          {currentView === "select" ? (
            <div className="space-y-4">
              <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                사용 중인 기기를 선택해주세요
              </p>

              {/* 안드로이드 버튼 */}
              <button
                onClick={handleAndroidClick}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      안드로이드
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Android 사용자
                    </p>
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
                    <p className="font-medium text-gray-900 dark:text-white">
                      아이폰
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      iOS / iPhone 사용자
                    </p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                  <Apple className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  아이폰 설치 안내
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Safari 브라우저에서만 설치할 수 있습니다
                </p>
              </div>

              {/* 단계별 안내 */}
              <div className="space-y-4">
                {/* 1단계 */}
                <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      Safari로 이 페이지 열기
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Safari 브라우저로 현재 페이지에 접속하세요
                    </p>
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

              <Button
                onClick={handleClose}
                className="w-full"
                variant="outline"
              >
                확인
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
