-- 정기점검 이력 테이블에 결과 컬럼 추가
ALTER TABLE inspection_history
ADD COLUMN IF NOT EXISTS inspection_result VARCHAR(10) DEFAULT 'No';

-- 기존 데이터에 기본값 설정
UPDATE inspection_history
SET inspection_result = 'No'
WHERE inspection_result IS NULL;
