-- drivermgm 스키마 생성
CREATE SCHEMA IF NOT EXISTS drivermgm;

-- 스키마에 대한 권한 설정
GRANT USAGE ON SCHEMA drivermgm TO anon, authenticated, service_role;
GRANT CREATE ON SCHEMA drivermgm TO service_role;

-- 테이블 이동: vehicles
ALTER TABLE public.vehicles SET SCHEMA drivermgm;

-- 테이블 이동: vehicle_users
ALTER TABLE public.vehicle_users SET SCHEMA drivermgm;

-- 테이블 이동: vehicle_field_history
ALTER TABLE public.vehicle_field_history SET SCHEMA drivermgm;

-- 테이블 이동: inspection_history
ALTER TABLE public.inspection_history SET SCHEMA drivermgm;

-- 테이블 이동: refueling_history
ALTER TABLE public.refueling_history SET SCHEMA drivermgm;

-- 테이블 이동: maintenance_records
ALTER TABLE public.maintenance_records SET SCHEMA drivermgm;

-- 모든 drivermgm 스키마 테이블에 대해 기본 권한 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA drivermgm GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA drivermgm GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA drivermgm GRANT ALL ON TABLES TO service_role;

-- 각 테이블에 대한 현재 권한 설정
GRANT SELECT ON ALL TABLES IN SCHEMA drivermgm TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA drivermgm TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA drivermgm TO service_role;

-- Sequences 권한
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA drivermgm TO anon, authenticated, service_role;

-- 마이그레이션 완료 로그
COMMIT;
