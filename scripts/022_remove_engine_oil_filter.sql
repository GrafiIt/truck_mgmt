-- Remove engine_oil_filter column from vehicles table
ALTER TABLE vehicles DROP COLUMN IF EXISTS engine_oil_filter_date;
ALTER TABLE vehicles DROP COLUMN IF EXISTS engine_oil_filter_mileage;
