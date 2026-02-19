-- Create query_sql function to allow dynamic SQL SELECT queries
-- Returns JSON results, unlike exec_sql which returns void

CREATE OR REPLACE FUNCTION public.query_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION public.query_sql(text) TO service_role;

COMMENT ON FUNCTION public.query_sql IS 'Executes dynamic SQL SELECT queries and returns JSON results. Used for bypassing PostgREST schema cache issues.';
