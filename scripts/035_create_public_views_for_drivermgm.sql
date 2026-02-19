-- Create views in public schema to access drivermgm tables
-- This allows the Supabase JavaScript client to access these tables without schema-qualified names

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.vehicle_users CASCADE;
DROP VIEW IF EXISTS public.vehicles CASCADE;
DROP VIEW IF EXISTS public.vehicle_field_history CASCADE;
DROP VIEW IF EXISTS public.inspection_history CASCADE;
DROP VIEW IF EXISTS public.maintenance_records CASCADE;
DROP VIEW IF EXISTS public.refueling_history CASCADE;

-- Create views that redirect to drivermgm schema tables
CREATE VIEW public.vehicle_users AS SELECT * FROM drivermgm.vehicle_users;
CREATE VIEW public.vehicles AS SELECT * FROM drivermgm.vehicles;
CREATE VIEW public.vehicle_field_history AS SELECT * FROM drivermgm.vehicle_field_history;
CREATE VIEW public.inspection_history AS SELECT * FROM drivermgm.inspection_history;
CREATE VIEW public.maintenance_records AS SELECT * FROM drivermgm.maintenance_records;
CREATE VIEW public.refueling_history AS SELECT * FROM drivermgm.refueling_history;

-- Create instead-of triggers for INSERT operations
CREATE OR REPLACE FUNCTION public.vehicle_users_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO drivermgm.vehicle_users (username, password, created_at, updated_at) 
  VALUES (NEW.username, NEW.password, NEW.created_at, NEW.updated_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_users_insert INSTEAD OF INSERT ON public.vehicle_users
FOR EACH ROW EXECUTE FUNCTION public.vehicle_users_insert_trigger();

CREATE OR REPLACE FUNCTION public.vehicle_field_history_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO drivermgm.vehicle_field_history 
  (vehicle_id, maintenance_date, field_name, field_label, date_value, mileage_value, text_value, text_value2, repair_shop, cost, created_at)
  VALUES (NEW.vehicle_id, NEW.maintenance_date, NEW.field_name, NEW.field_label, NEW.date_value, NEW.mileage_value, NEW.text_value, NEW.text_value2, NEW.repair_shop, NEW.cost, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_field_history_insert INSTEAD OF INSERT ON public.vehicle_field_history
FOR EACH ROW EXECUTE FUNCTION public.vehicle_field_history_insert_trigger();

CREATE OR REPLACE FUNCTION public.inspection_history_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO drivermgm.inspection_history 
  (vehicle_id, maintenance_date, inspection_date, inspection_name, inspection_result, inspection_notes, email_1, email_2, repair_shop, cost, created_at, last_email_sent_date)
  VALUES (NEW.vehicle_id, NEW.maintenance_date, NEW.inspection_date, NEW.inspection_name, NEW.inspection_result, NEW.inspection_notes, NEW.email_1, NEW.email_2, NEW.repair_shop, NEW.cost, NEW.created_at, NEW.last_email_sent_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inspection_history_insert INSTEAD OF INSERT ON public.inspection_history
FOR EACH ROW EXECUTE FUNCTION public.inspection_history_insert_trigger();

-- Create instead-of triggers for UPDATE operations
CREATE OR REPLACE FUNCTION public.vehicle_field_history_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE drivermgm.vehicle_field_history 
  SET maintenance_date = NEW.maintenance_date, date_value = NEW.date_value, mileage_value = NEW.mileage_value,
      text_value = NEW.text_value, text_value2 = NEW.text_value2, repair_shop = NEW.repair_shop, cost = NEW.cost
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_field_history_update INSTEAD OF UPDATE ON public.vehicle_field_history
FOR EACH ROW EXECUTE FUNCTION public.vehicle_field_history_update_trigger();

CREATE OR REPLACE FUNCTION public.inspection_history_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE drivermgm.inspection_history 
  SET maintenance_date = NEW.maintenance_date, inspection_date = NEW.inspection_date, inspection_name = NEW.inspection_name,
      inspection_result = NEW.inspection_result, inspection_notes = NEW.inspection_notes, email_1 = NEW.email_1, 
      email_2 = NEW.email_2, repair_shop = NEW.repair_shop, cost = NEW.cost
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inspection_history_update INSTEAD OF UPDATE ON public.inspection_history
FOR EACH ROW EXECUTE FUNCTION public.inspection_history_update_trigger();

-- Create instead-of triggers for DELETE operations
CREATE OR REPLACE FUNCTION public.vehicle_field_history_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM drivermgm.vehicle_field_history WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_field_history_delete INSTEAD OF DELETE ON public.vehicle_field_history
FOR EACH ROW EXECUTE FUNCTION public.vehicle_field_history_delete_trigger();

CREATE OR REPLACE FUNCTION public.inspection_history_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM drivermgm.inspection_history WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inspection_history_delete INSTEAD OF DELETE ON public.inspection_history
FOR EACH ROW EXECUTE FUNCTION public.inspection_history_delete_trigger();
