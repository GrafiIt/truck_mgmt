import { createBrowserClient } from "@supabase/ssr"

// 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
