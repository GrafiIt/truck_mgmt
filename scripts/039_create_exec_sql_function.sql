-- Create exec_sql function to allow dynamic SQL execution
-- This is needed for creating company-specific tables dynamically

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

COMMENT ON FUNCTION public.exec_sql IS 'Executes dynamic SQL queries. Used for creating company-specific tables in multi-tenant architecture.';
