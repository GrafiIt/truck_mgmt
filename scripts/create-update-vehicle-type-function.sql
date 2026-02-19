-- Create a function to update vehicle_type that bypasses PostgREST schema cache
CREATE OR REPLACE FUNCTION drivermgm.update_vehicle_type(
  p_table_name text,
  p_vehicle_number text,
  p_vehicle_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('UPDATE drivermgm.%I SET vehicle_type = $1 WHERE vehicle_number = $2', p_table_name)
  USING p_vehicle_type, p_vehicle_number;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION drivermgm.update_vehicle_type(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION drivermgm.update_vehicle_type(text, text, text) TO service_role;
