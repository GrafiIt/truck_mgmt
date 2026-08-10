-- 062_add_receipt_image_url_to_company_tables.sql
--
-- 문제: receipt_image_url 컬럼이 vehicle_field_history_human / inspection_history_human /
--      refueling_history_human 테이블에는 있지만, vehicle_field_history_kukdong /
--      inspection_history_kukdong / refueling_history_kukdong 테이블에는 누락되어 있음.
--      (기업코드별로 테이블이 분리되어 있는 멀티테넌시 구조라서, human 테이블에만
--       컬럼을 추가하고 kukdong 테이블에는 반영하지 않아 발생한 스키마 불일치 문제)
--
-- 조치: kukdong 테이블 3개에 동일한 컬럼을 추가합니다.
--      앞으로 새 기업(회사코드)이 추가되거나, 위 3개 테이블에 새 컬럼을 추가할 때는
--      반드시 모든 회사(_human, _kukdong, ...) 테이블에 동일하게 적용해야 합니다.

ALTER TABLE drivermgm.vehicle_field_history_kukdong
  ADD COLUMN IF NOT EXISTS receipt_image_url TEXT;

ALTER TABLE drivermgm.inspection_history_kukdong
  ADD COLUMN IF NOT EXISTS receipt_image_url TEXT;

ALTER TABLE drivermgm.refueling_history_kukdong
  ADD COLUMN IF NOT EXISTS receipt_image_url TEXT;

COMMENT ON COLUMN drivermgm.vehicle_field_history_kukdong.receipt_image_url IS '영수증/명세서 이미지 URL';
COMMENT ON COLUMN drivermgm.inspection_history_kukdong.receipt_image_url IS '영수증/명세서 이미지 URL';
COMMENT ON COLUMN drivermgm.refueling_history_kukdong.receipt_image_url IS '영수증/명세서 이미지 URL';
