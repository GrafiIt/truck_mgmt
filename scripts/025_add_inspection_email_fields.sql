-- Add email fields to inspection_history table for email notifications
ALTER TABLE inspection_history
ADD COLUMN IF NOT EXISTS email_1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_email_sent_date DATE;

COMMENT ON COLUMN inspection_history.email_1 IS '담당자 이메일 1';
COMMENT ON COLUMN inspection_history.email_2 IS '담당자 이메일 2';
COMMENT ON COLUMN inspection_history.last_email_sent_date IS '마지막 이메일 발송일';
