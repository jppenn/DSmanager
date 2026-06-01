-- =============================================================================
-- Storage bucket for proof-of-delivery files
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('pod', 'pod', false)
on conflict (id) do nothing;

-- Internal users can do everything with POD files.
create policy "pod_internal_all"
  on storage.objects for all
  using (bucket_id = 'pod' and public.is_internal())
  with check (bucket_id = 'pod' and public.is_internal());

-- Vendor users can read & upload POD files for their own POs.
-- Files are stored under: <vendor_po_id>/<filename>
create policy "pod_vendor_rw"
  on storage.objects for all
  using (
    bucket_id = 'pod'
    and exists (
      select 1 from public.vendor_purchase_orders vpo
      where vpo.id::text = (storage.foldername(name))[1]
        and vpo.vendor_id = public.current_user_vendor_id()
    )
  )
  with check (
    bucket_id = 'pod'
    and exists (
      select 1 from public.vendor_purchase_orders vpo
      where vpo.id::text = (storage.foldername(name))[1]
        and vpo.vendor_id = public.current_user_vendor_id()
    )
  );
