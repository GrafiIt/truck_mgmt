-- Add "기타" (Others) column to vehicles table with summary field
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS others_date DATE,
ADD COLUMN IF NOT EXISTS others_mileage INTEGER,
ADD COLUMN IF NOT EXISTS others_summary VARCHAR(100);

-- Add comment for new columns
COMMENT ON COLUMN vehicles.others_date IS '기타 정비 날짜';
COMMENT ON COLUMN vehicles.others_mileage IS '기타 정비 시 주행거리';
COMMENT ON COLUMN vehicles.others_summary IS '기타 한줄요약 (한글 20자/영어 30자 제한)';
