import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

function sanitizeFilename(filename: string): string {
  // Windows에서 문제가 될 수 있는 특수 문자 제거
  let sanitized = filename.replace(/[<>:"|?*\\/]/g, "_")

  // 연속된 공백을 하나로 변경
  sanitized = sanitized.replace(/\s+/g, " ")

  // 파일명이 너무 길면 자르기 (확장자는 유지)
  const maxLength = 200
  if (sanitized.length > maxLength) {
    const ext = sanitized.substring(sanitized.lastIndexOf("."))
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf("."))
    sanitized = nameWithoutExt.substring(0, maxLength - ext.length) + ext
  }

  return sanitized
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API called")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[v0] No file provided in request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      console.error("[v0] File too large:", file.size)
      return NextResponse.json({ error: "파일 크기는 50MB를 초과할 수 없습니다." }, { status: 400 })
    }

    const sanitizedFilename = sanitizeFilename(file.name)
    console.log("[v0] Sanitized filename:", sanitizedFilename)

    const timestamp = Date.now()
    const ext = sanitizedFilename.substring(sanitizedFilename.lastIndexOf("."))
    const nameWithoutExt = sanitizedFilename.substring(0, sanitizedFilename.lastIndexOf("."))
    const uniqueFilename = `${nameWithoutExt}_${timestamp}${ext}`

    console.log("[v0] Uploading to Vercel Blob:", uniqueFilename)

    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, file, {
      access: "public",
    })

    console.log("[v0] Upload successful:", blob.url)

    return NextResponse.json({
      url: blob.url,
      filename: sanitizedFilename, // 원본 파일명 (정규화된 버전) 반환
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      {
        error: "파일 업로드에 실패했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
