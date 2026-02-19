import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "차량관리",
  description: "차량관리시스템",
}

export default function DriverMgmLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
