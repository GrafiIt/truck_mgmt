-- inspection_history 테이블에 inspection_notes 컬럼 추가
ALTER TABLE inspection_history ADD COLUMN IF NOT EXISTS inspection_notes TEXT;

-- inspection_history_k 테이블에도 동일한 컬럼 추가
ALTER TABLE inspection_history_k ADD COLUMN IF NOT EXISTS inspection_notes TEXT;

-- vehicles 테이블에 inspection_notes 컬럼 추가
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS inspection_notes TEXT;

-- vehicles_k 테이블에도 동일한 컬럼 추가
ALTER TABLE vehicles_k ADD COLUMN IF NOT EXISTS inspection_notes TEXT;
