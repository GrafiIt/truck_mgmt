-- Fix permissions for master_user table and sequence
-- This allows the service role to properly insert data into master_user

-- Grant permissions on the table
GRANT ALL ON drivermgm.master_user TO postgres;
GRANT ALL ON drivermgm.master_user TO service_role;
GRANT SELECT ON drivermgm.master_user TO anon;
GRANT SELECT ON drivermgm.master_user TO authenticated;

-- Grant permissions on the sequence
GRANT ALL ON SEQUENCE drivermgm.master_user_id_seq TO postgres;
GRANT ALL ON SEQUENCE drivermgm.master_user_id_seq TO service_role;
GRANT USAGE ON SEQUENCE drivermgm.master_user_id_seq TO anon;
GRANT USAGE ON SEQUENCE drivermgm.master_user_id_seq TO authenticated;

-- Disable RLS for master_user table (master admin access only)
ALTER TABLE drivermgm.master_user DISABLE ROW LEVEL SECURITY;

-- Re-create public view with proper permissions
DROP VIEW IF EXISTS public.master_user CASCADE;

CREATE VIEW public.master_user AS
SELECT * FROM drivermgm.master_user;

GRANT ALL ON public.master_user TO postgres;
GRANT ALL ON public.master_user TO service_role;
GRANT SELECT ON public.master_user TO anon;
GRANT SELECT ON public.master_user TO authenticated;

-- Create instead-of trigger for the view
CREATE OR REPLACE FUNCTION public.master_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO drivermgm.master_user (company_code, company_name, created_at)
  VALUES (NEW.company_code, NEW.company_name, NEW.created_at)
  RETURNING * INTO NEW;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER master_user_insert_trigger
INSTEAD OF INSERT ON public.master_user
FOR EACH ROW EXECUTE FUNCTION public.master_user_insert();

CREATE OR REPLACE FUNCTION public.master_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM drivermgm.master_user WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER master_user_delete_trigger
INSTEAD OF DELETE ON public.master_user
FOR EACH ROW EXECUTE FUNCTION public.master_user_delete();
