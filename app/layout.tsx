import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Driver Management System",
  description: "Vehicle and Driver Management System",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${inter.variable} ${jetbrainsMono.variable} flex flex-col min-h-screen`}>
        <div className="flex-1">
          {children}
        </div>
        <footer className="py-4 px-4 border-t bg-background text-center">
          <p className="text-xs text-muted-foreground">
            copyright 그라피아이티(grafi-it@outlook.kr)
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  )
}
