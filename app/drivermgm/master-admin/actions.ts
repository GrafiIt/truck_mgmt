"use server"

import { createAdminClient } from "@/lib/supabase/server"

export async function masterAdminLogin(username: string, password: string) {
  try {
    const supabase = await createAdminClient()
    
    console.log("[v0] Login attempt - Input:", { username, password })
    
    // hunwoo 스키마에서 모든 테이블 나열 (디버깅용)
    const { data: tables, error: tablesError } = await supabase
      .schema("hunwoo")
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "hunwoo")
    
    console.log("[v0] Available tables in hunwoo schema:", { tables, error: tablesError?.message })

    // 먼저 hunwoo 스키마에서 시도
    let { data, error } = await supabase
      .schema("hunwoo")
      .from("hun_main_pass_manager")
      .select("login_id, login_ps")
      .eq("project_num", 1002)
      .single()

    console.log("[v0] hunwoo schema query:", { error: error?.message, data })

    // hunwoo 스키마 실패시 public 스키마 시도
    if (error) {
      console.log("[v0] hunwoo schema failed, trying public schema")
      const result = await supabase
        .from("hun_main_pass_manager")
        .select("login_id, login_ps")
        .eq("project_num", 1002)
        .single()
      
      data = result.data
      error = result.error
      console.log("[v0] public schema query:", { error: error?.message, data })
    }

    if (error) {
      console.log("[v0] Database error details:", error)
      // 테이블이 없을 수 있으니 안내 메시지 제공
      if (error.code === "PGRST116") {
        return { success: false, error: "hun_main_pass_manager 테이블을 찾을 수 없습니다. 데이터베이스 설정을 확인해주세요." }
      }
      return { success: false, error: `데이터베이스 오류: ${error.message}` }
    }

    if (!data) {
      console.log("[v0] No data found for project_num 1002")
      return { success: false, error: "project_num 1002에 해당하는 관리자 정보를 찾을 수 없습니다." }
    }

    // 입력된 자격증명과 데이터베이스의 자격증명 비교
    const usernameMatch = username === data.login_id
    const passwordMatch = password === data.login_ps
    
    console.log("[v0] Credentials comparison:", {
      inputUsername: username,
      dbUsername: data.login_id,
      usernameMatch,
      inputPassword: password,
      dbPassword: data.login_ps,
      passwordMatch,
      usernameLength: { input: username.length, db: data.login_id.length },
      passwordLength: { input: password.length, db: data.login_ps.length }
    })

    if (usernameMatch && passwordMatch) {
      console.log("[v0] Login successful")
      return { success: true }
    }

    if (!usernameMatch) {
      return { success: false, error: `아이디가 일치하지 않습니다. (입력: ${username}, DB: ${data.login_id})` }
    }
    
    return { success: false, error: "비밀번호가 일치하지 않습니다." }
  } catch (err) {
    console.log("[v0] Exception in masterAdminLogin:", err)
    return { success: false, error: `로그인 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}` }
  }
}

export async function changeMasterPassword(newPassword: string) {
  try {
    const supabase = await createAdminClient()
    
    // hun_main_pass_manager 테이블에서 project_num = 1002인 행의 login_ps 업데이트
    const { error } = await supabase
      .schema("hunwoo")
      .from("hun_main_pass_manager")
      .update({ login_ps: newPassword })
      .eq("project_num", 1002)

    if (error) {
      return { success: false, error: "비밀번호 변경에 실패했습니다." }
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
  // 관리자 인증 확인
  try {
    const supabase = await createAdminClient()
    
    // hun_main_pass_manager 테이블에서 project_num = 1002인 행의 login_id와 login_ps 조회
    const { data: authData, error: authError } = await supabase
      .schema("hunwoo")
      .from("hun_main_pass_manager")
      .select("login_id, login_ps")
      .eq("project_num", 1002)
      .single()

    if (authError || !authData) {
      return { success: false, error: "관리자 정보를 불러오지 못했습니다." }
    }

    // 입력된 자격증명과 데이터베이스의 자격증명 비교
    if (confirmUsername !== authData.login_id || confirmPassword !== authData.login_ps) {
      return { success: false, error: "관리자 인증에 실패했습니다." }
    }

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
