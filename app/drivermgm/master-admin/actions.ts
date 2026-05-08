"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

// hunwoo 스키마의 hun_main_pass_manager 테이블에서 마스터 관리자 정보 조회
async function getMasterAdminCredentials() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("hun_main_pass_manager")
    .select("login_id, login_ps")
    .eq("project_num", "1002")
    .single()

  if (error || !data) {
    console.error("마스터 관리자 정보 조회 실패:", error)
    return null
  }

  return {
    username: data.login_id,
    password: data.login_ps,
  }
}

export async function masterAdminLogin(username: string, password: string) {
  const credentials = await getMasterAdminCredentials()
  
  if (!credentials) {
    return { success: false, error: "관리자 정보를 불러올 수 없습니다." }
  }

  if (username === credentials.username && password === credentials.password) {
    return { success: true }
  }
  return { success: false, error: "관리자 아이디 또는 비밀번호가 올바르지 않습니다." }
}

export async function changeMasterPassword(newPassword: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("hun_main_pass_manager")
      .update({ login_ps: newPassword })
      .eq("project_num", "1002")

    if (error) {
      console.error("비밀번호 변경 실패:", error)
      return { success: false, error: "비밀번호 변경 중 오류가 발생했습니다." }
    }
    
    return { success: true }
  } catch (err) {
    return { success: false, error: "비밀번호 변경 중 오류가 발생했습니다." }
  }
}

export async function getCompanies() {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .schema("drivermgm")
      .from("master_user")
      .select("company_code, company_name, created_at, phone, email, business_number, address")
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: "기업 목록을 불러오지 못했습니다." }
    }

    return { success: true, companies: data }
  } catch (err) {
    return { success: false, error: "기업 목록을 불러오는 중 오류가 발생했습니다." }
  }
}

export async function addCompany(companyCode: string, companyName: string) {
  try {
    const supabase = await createAdminClient()

    // 1. master_user에 기업 추가
    const { error: insertError } = await supabase
      .schema("drivermgm")
      .from("master_user")
      .insert({
        company_code: companyCode,
        company_name: companyName,
      })

    if (insertError) {
      return { success: false, error: "기업 추가에 실패했습니다. 이미 존재하는 기업코드일 수 있습니다." }
    }

    // 2. 기업별 테이블 생성 및 초기 사용자 추가
    const createTablesQuery = `
      -- vehicles 테이블
      CREATE TABLE IF NOT EXISTS drivermgm.vehicles_${companyCode} (LIKE drivermgm.vehicles_human INCLUDING ALL);
      ALTER TABLE drivermgm.vehicles_${companyCode} ENABLE ROW LEVEL SECURITY;

      -- vehicle_users 테이블
      CREATE TABLE IF NOT EXISTS drivermgm.vehicle_users_${companyCode} (LIKE drivermgm.vehicle_users_human INCLUDING ALL);
      ALTER TABLE drivermgm.vehicle_users_${companyCode} ENABLE ROW LEVEL SECURITY;
      
      -- vehicle_field_history 테이블
      CREATE TABLE IF NOT EXISTS drivermgm.vehicle_field_history_${companyCode} (LIKE drivermgm.vehicle_field_history_human INCLUDING ALL);
      ALTER TABLE drivermgm.vehicle_field_history_${companyCode} ENABLE ROW LEVEL SECURITY;

      -- inspection_history 테이블
      CREATE TABLE IF NOT EXISTS drivermgm.inspection_history_${companyCode} (LIKE drivermgm.inspection_history_human INCLUDING ALL);
      ALTER TABLE drivermgm.inspection_history_${companyCode} ENABLE ROW LEVEL SECURITY;

      -- refueling_history 테이블
      CREATE TABLE IF NOT EXISTS drivermgm.refueling_history_${companyCode} (LIKE drivermgm.refueling_history_human INCLUDING ALL);
      ALTER TABLE drivermgm.refueling_history_${companyCode} ENABLE ROW LEVEL SECURITY;

      -- maintenance_records 테이블
      CREATE TABLE IF NOT EXISTS drivermgm.maintenance_records_${companyCode} (LIKE drivermgm.maintenance_records_human INCLUDING ALL);
      ALTER TABLE drivermgm.maintenance_records_${companyCode} ENABLE ROW LEVEL SECURITY;

      -- public 스키마에 view 생성
      CREATE OR REPLACE VIEW public.vehicles_${companyCode} AS SELECT * FROM drivermgm.vehicles_${companyCode};
      CREATE OR REPLACE VIEW public.vehicle_users_${companyCode} AS SELECT * FROM drivermgm.vehicle_users_${companyCode};
      CREATE OR REPLACE VIEW public.vehicle_field_history_${companyCode} AS SELECT * FROM drivermgm.vehicle_field_history_${companyCode};
      CREATE OR REPLACE VIEW public.inspection_history_${companyCode} AS SELECT * FROM drivermgm.inspection_history_${companyCode};
      CREATE OR REPLACE VIEW public.refueling_history_${companyCode} AS SELECT * FROM drivermgm.refueling_history_${companyCode};
      CREATE OR REPLACE VIEW public.maintenance_records_${companyCode} AS SELECT * FROM drivermgm.maintenance_records_${companyCode};

      -- 초기 관리자 계정 추가 (admin / 1024)
      INSERT INTO drivermgm.vehicle_users_${companyCode} (username, password, created_at, updated_at)
      VALUES ('admin', '1024', NOW(), NOW());
    `

    const { error: createError } = await supabase.rpc("exec_sql", { sql_query: createTablesQuery })

    if (createError) {
      // 롤백: master_user에서 삭제
      await supabase.schema("drivermgm").from("master_user").delete().eq("company_code", companyCode)
      return { success: false, error: "테이블 생성 중 오류가 발생했습니다." }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: "기업 추가 중 오류가 발생했습니다." }
  }
}

export async function updateCompany(
  companyCode: string,
  companyName: string,
  phone?: string,
  email?: string,
  businessNumber?: string,
  address?: string
) {
  try {
    const supabase = await createAdminClient()

    const { error } = await supabase
      .schema("drivermgm")
      .from("master_user")
      .update({
        company_name: companyName,
        phone: phone || null,
        email: email || null,
        business_number: businessNumber || null,
        address: address || null,
        updated_at: new Date().toISOString(),
      })
      .eq("company_code", companyCode)

    if (error) {
      return { success: false, error: "기업 정보 수정에 실패했습니다." }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: "기업 정보 수정 중 오류가 발생했습니다." }
  }
}

export async function changeCompanyAdminPassword(companyCode: string, newPassword: string) {
  try {
    const supabase = await createAdminClient()

    // vehicle_users_[companyCode] 테이블에서 admin 계정의 비밀번호 업데이트
    const { error } = await supabase
      .schema("drivermgm")
      .from(`vehicle_users_${companyCode}`)
      .update({
        password: newPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("username", "admin")

    if (error) {
      return { success: false, error: "비밀번호 변경에 실패했습니다." }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: "비밀번호 변경 중 오류가 발생했습니다." }
  }
}

export async function deleteCompany(companyCode: string, confirmUsername: string, confirmPassword: string) {
  // 관리자 인증 확인 - DB에서 조회
  const credentials = await getMasterAdminCredentials()
  
  if (!credentials) {
    return { success: false, error: "관리자 정보를 불러올 수 없습니다." }
  }
  
  if (confirmUsername !== credentials.username || confirmPassword !== credentials.password) {
    return { success: false, error: "관리자 인증에 실패했습니다." }
  }

  try {
    const supabase = await createAdminClient()

    // 1. 기업별 테이블 삭제
    const deleteTablesQuery = `
      -- 테이블 삭제
      DROP TABLE IF EXISTS drivermgm.vehicles_${companyCode} CASCADE;
      DROP TABLE IF EXISTS drivermgm.vehicle_users_${companyCode} CASCADE;
      DROP TABLE IF EXISTS drivermgm.vehicle_field_history_${companyCode} CASCADE;
      DROP TABLE IF EXISTS drivermgm.inspection_history_${companyCode} CASCADE;
      DROP TABLE IF EXISTS drivermgm.refueling_history_${companyCode} CASCADE;
      DROP TABLE IF EXISTS drivermgm.maintenance_records_${companyCode} CASCADE;

      -- View 삭제 (CASCADE로 자동 삭제되지만 명시적으로)
      DROP VIEW IF EXISTS public.vehicles_${companyCode} CASCADE;
      DROP VIEW IF EXISTS public.vehicle_users_${companyCode} CASCADE;
      DROP VIEW IF EXISTS public.vehicle_field_history_${companyCode} CASCADE;
      DROP VIEW IF EXISTS public.inspection_history_${companyCode} CASCADE;
      DROP VIEW IF EXISTS public.refueling_history_${companyCode} CASCADE;
      DROP VIEW IF EXISTS public.maintenance_records_${companyCode} CASCADE;
    `

    const { error: deleteError } = await supabase.rpc("exec_sql", { sql_query: deleteTablesQuery })

    if (deleteError) {
      return { success: false, error: "테이블 삭제 중 오류가 발생했습니다." }
    }

    // 2. master_user에서 기업 삭제
    const { error: masterDeleteError } = await supabase
      .schema("drivermgm")
      .from("master_user")
      .delete()
      .eq("company_code", companyCode)

    if (masterDeleteError) {
      return { success: false, error: "기업 정보 삭제 중 오류가 발생했습니다." }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: "기업 삭제 중 오류가 발생했습니다." }
  }
}
