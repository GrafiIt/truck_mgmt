-- Add repair_shop and cost columns to inspection_history table
ALTER TABLE inspection_history
ADD COLUMN IF NOT EXISTS repair_shop character varying,
ADD COLUMN IF NOT EXISTS cost integer;

COMMIT;
