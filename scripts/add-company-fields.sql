-- Add new columns to master_user table
ALTER TABLE drivermgm.master_user 
ADD COLUMN IF NOT EXISTS phone character varying(20),
ADD COLUMN IF NOT EXISTS email character varying(255),
ADD COLUMN IF NOT EXISTS business_number character varying(50),
ADD COLUMN IF NOT EXISTS address text;
