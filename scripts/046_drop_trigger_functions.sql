-- 트리거 함수 자체를 완전히 제거합니다
-- 트리거가 아니라 함수 자체를 삭제해야 합니다

-- vehicles_human_update 함수 삭제
DROP FUNCTION IF EXISTS drivermgm.vehicles_human_update() CASCADE;

-- vehicles_kukdong_update 함수 삭제 (다른 회사 테이블)
DROP FUNCTION IF EXISTS drivermgm.vehicles_kukdong_update() CASCADE;

-- 모든 vehicles_*_update 패턴의 함수 삭제
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, pronamespace::regnamespace::text as schema_name
        FROM pg_proc
        WHERE proname LIKE 'vehicles_%_update'
        AND pronamespace = 'drivermgm'::regnamespace
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I() CASCADE', 
                      func_record.schema_name, 
                      func_record.proname);
        RAISE NOTICE 'Dropped function: %.%', func_record.schema_name, func_record.proname;
    END LOOP;
END $$;
