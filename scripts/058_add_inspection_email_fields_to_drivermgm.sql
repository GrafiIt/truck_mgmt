-- 058: drivermgm 스키마의 inspection_history 테이블에 이메일 알람 컬럼 추가
-- (025번 스크립트는 public 스키마 대상이었으므로 drivermgm 스키마에 별도 적용)

ALTER TABLE drivermgm.inspection_history_human
  ADD COLUMN IF NOT EXISTS email_1            VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_2            VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_email_sent_date DATE;

COMMENT ON COLUMN drivermgm.inspection_history_human.email_1             IS '알람 수신 이메일 1';
COMMENT ON COLUMN drivermgm.inspection_history_human.email_2             IS '알람 수신 이메일 2';
COMMENT ON COLUMN drivermgm.inspection_history_human.last_email_sent_date IS '마지막 이메일 발송일 (중복 발송 방지)';
