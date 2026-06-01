-- =============================================================================
-- Seed data for local development / demo.
-- Run AFTER 0001_init.sql and 0002_storage.sql.
-- NOTE: users are created through Supabase Auth (the trg_auth_user_created
-- trigger inserts the profile). To make a profile an admin or attach a vendor,
-- update public.users after signing in, e.g.:
--   update public.users set role = 'admin' where email = 'you@company.com';
--   update public.users set role = 'vendor', vendor_id = '<vendor uuid>'
--     where email = 'vendor@acme.com';
-- =============================================================================

insert into vendors (id, name, contact_person, email, phone, payment_terms, lead_time_days, notes)
values
  ('11111111-1111-1111-1111-111111111111', 'Acme Distribution', 'Dana Lee', 'sales@acme-dist.example', '555-0100', 'Net 30', 3, 'Primary west-coast supplier'),
  ('22222222-2222-2222-2222-222222222222', 'Globex Supply Co', 'Pat Morgan', 'orders@globex.example', '555-0200', 'Net 45', 5, 'Bulk electronics'),
  ('33333333-3333-3333-3333-333333333333', 'Initech Wholesale', 'Sam Rivera', 'fulfillment@initech.example', '555-0300', 'Net 15', 2, NULL)
on conflict (id) do nothing;

insert into customers (id, name, contact_name, contact_email, contact_phone, ship_to_line1, ship_to_city, ship_to_state, ship_to_postal_code)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Northwind Traders', 'Avery Quinn', 'avery@northwind.example', '555-0400', '100 Market St', 'Seattle', 'WA', '98101'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Contoso Retail', 'Jordan Blake', 'jordan@contoso.example', '555-0500', '200 Main Ave', 'Portland', 'OR', '97201')
on conflict (id) do nothing;
