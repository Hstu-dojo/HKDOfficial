CREATE TABLE IF NOT EXISTS organization_application_codes (
 number integer PRIMARY KEY CHECK (number BETWEEN 1 AND 99),
 partner_id text UNIQUE REFERENCES partners(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS application_number_counters (
 year integer NOT NULL CHECK (year BETWEEN 2000 AND 2099),
 organization_number integer NOT NULL CHECK (organization_number BETWEEN 0 AND 99),
 serial integer NOT NULL CHECK (serial BETWEEN 1 AND 999),
 PRIMARY KEY (year,organization_number)
);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION ensure_organization_application_code(p_partner_id text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE code integer;
BEGIN
 IF p_partner_id IS NULL THEN RETURN 0; END IF;
 SELECT number INTO code FROM organization_application_codes WHERE partner_id=p_partner_id;
 IF code IS NOT NULL THEN RETURN code; END IF;
 PERFORM pg_advisory_xact_lock(654321036);
 SELECT number INTO code FROM organization_application_codes WHERE partner_id=p_partner_id;
 IF code IS NOT NULL THEN RETURN code; END IF;
 SELECT coalesce(max(number),0)+1 INTO code FROM organization_application_codes;
 IF code>99 THEN RAISE EXCEPTION 'Two-digit organization numbering is full (99 organizations)'; END IF;
 INSERT INTO organization_application_codes(number,partner_id) VALUES(code,p_partner_id);
 RETURN code;
END $$;
--> statement-breakpoint
DO $$ DECLARE org record; BEGIN
 FOR org IN SELECT id FROM partners ORDER BY created_at,id LOOP
  PERFORM ensure_organization_application_code(org.id);
 END LOOP;
END $$;
--> statement-breakpoint
-- Continue beyond historical applications; rerunning the migration never lowers a counter.
INSERT INTO application_number_counters(year,organization_number,serial)
SELECT extract(year FROM timezone('Asia/Dhaka',a.created_at))::integer,
       coalesce(o.number,0),
       greatest(count(*)::integer,coalesce(max(CASE WHEN a.application_number ~ '^[0-9]{7}$' THEN CASE WHEN
         substring(a.application_number,3,2)::integer=coalesce(o.number,0)
         AND substring(a.application_number,1,2)::integer=extract(year FROM timezone('Asia/Dhaka',a.created_at))::integer%100
         THEN right(a.application_number,3)::integer END END),0))
FROM enrollment_applications a JOIN courses c ON c.id=a.course_id
LEFT JOIN organization_application_codes o ON o.partner_id=c.partner_id
GROUP BY 1,2
ON CONFLICT(year,organization_number) DO UPDATE SET serial=greatest(application_number_counters.serial,excluded.serial);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION next_enrollment_application_number(p_partner_id text,p_year integer DEFAULT extract(year FROM timezone('Asia/Dhaka',now()))::integer)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE code integer; allocated integer;
BEGIN
 IF p_year NOT BETWEEN 2000 AND 2099 THEN RAISE EXCEPTION 'Application year must be between 2000 and 2099'; END IF;
 code:=ensure_organization_application_code(p_partner_id);
 INSERT INTO application_number_counters(year,organization_number,serial) VALUES(p_year,code,1)
 ON CONFLICT(year,organization_number) DO UPDATE SET serial=application_number_counters.serial+1
 WHERE application_number_counters.serial<999 RETURNING serial INTO allocated;
 IF allocated IS NULL THEN RAISE EXCEPTION 'This organization has reached 999 applications for this year'; END IF;
 RETURN lpad((p_year%100)::text,2,'0')||lpad(code::text,2,'0')||lpad(allocated::text,3,'0');
END $$;
--> statement-breakpoint
-- Number allocation is server-only; Supabase public clients cannot consume serials.
ALTER TABLE organization_application_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_number_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON FUNCTION ensure_organization_application_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION next_enrollment_application_number(text,integer) FROM PUBLIC;
DO $$ DECLARE role_name text; BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
   EXECUTE format('REVOKE ALL ON FUNCTION ensure_organization_application_code(text) FROM %I',role_name);
   EXECUTE format('REVOKE ALL ON FUNCTION next_enrollment_application_number(text,integer) FROM %I',role_name);
  END IF;
 END LOOP;
END $$;
