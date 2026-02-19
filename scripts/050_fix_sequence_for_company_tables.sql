-- Fix sequence synchronization for company-specific tables
-- This script resets the sequences to be in sync with the actual max ID in each table

-- For vehicle_field_history_human table - use correct sequence naming
DO $$
DECLARE
  v_seq_name TEXT;
BEGIN
  -- Find the sequence name for vehicle_field_history_human table
  SELECT pg_get_serial_sequence('vehicle_field_history_human', 'id') INTO v_seq_name;
  
  IF v_seq_name IS NOT NULL THEN
    EXECUTE 'SELECT setval(' || quote_literal(v_seq_name) || ', (SELECT COALESCE(MAX(id), 0) + 1 FROM vehicle_field_history_human))';
    RAISE NOTICE 'Reset sequence % for vehicle_field_history_human', v_seq_name;
  ELSE
    RAISE NOTICE 'No sequence found for vehicle_field_history_human';
  END IF;
END $$;

-- For vehicle_field_history_default table (if it exists)
DO $$
DECLARE
  v_seq_name TEXT;
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_field_history_default') THEN
    SELECT pg_get_serial_sequence('vehicle_field_history_default', 'id') INTO v_seq_name;
    
    IF v_seq_name IS NOT NULL THEN
      EXECUTE 'SELECT setval(' || quote_literal(v_seq_name) || ', (SELECT COALESCE(MAX(id), 0) + 1 FROM vehicle_field_history_default))';
      RAISE NOTICE 'Reset sequence % for vehicle_field_history_default', v_seq_name;
    END IF;
  END IF;
END $$;

-- For inspection_history_human table
DO $$
DECLARE
  v_seq_name TEXT;
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'inspection_history_human') THEN
    SELECT pg_get_serial_sequence('inspection_history_human', 'id') INTO v_seq_name;
    
    IF v_seq_name IS NOT NULL THEN
      EXECUTE 'SELECT setval(' || quote_literal(v_seq_name) || ', (SELECT COALESCE(MAX(id), 0) + 1 FROM inspection_history_human))';
      RAISE NOTICE 'Reset sequence % for inspection_history_human', v_seq_name;
    END IF;
  END IF;
END $$;

-- For inspection_history_default table (if it exists)
DO $$
DECLARE
  v_seq_name TEXT;
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'inspection_history_default') THEN
    SELECT pg_get_serial_sequence('inspection_history_default', 'id') INTO v_seq_name;
    
    IF v_seq_name IS NOT NULL THEN
      EXECUTE 'SELECT setval(' || quote_literal(v_seq_name) || ', (SELECT COALESCE(MAX(id), 0) + 1 FROM inspection_history_default))';
      RAISE NOTICE 'Reset sequence % for inspection_history_default', v_seq_name;
    END IF;
  END IF;
END $$;
