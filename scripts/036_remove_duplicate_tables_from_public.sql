-- 036_remove_duplicate_tables_from_public.sql
-- public 스키마의 중복 테이블들 삭제 (drivermgm 스키마에만 유지)

-- 1. public 스키마의 복사본 테이블 삭제
DROP TABLE IF EXISTS public.inspection_history CASCADE;
DROP TABLE IF EXISTS public.refueling_history CASCADE;
DROP TABLE IF EXISTS public.vehicle_field_history CASCADE;
DROP TABLE IF EXISTS public.maintenance_records CASCADE;
DROP TABLE IF EXISTS public.vehicle_users CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;

-- 확인: public 스키마의 drivermgm 관련 테이블이 모두 삭제되었는지 확인
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN 
-- ('inspection_history', 'refueling_history', 'vehicle_field_history', 'maintenance_records', 'vehicle_users', 'vehicles');

-- 삭제 후 확인 메시지
RAISE NOTICE 'Duplicate tables removed from public schema. Data is now exclusively in drivermgm schema.';
