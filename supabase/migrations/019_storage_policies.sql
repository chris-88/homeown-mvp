-- Storage RLS policies for the `documents` private bucket
-- Run this in the Supabase SQL editor.

-- Clients: upload to their own folder
create policy "clients: upload own docs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'clients'
    and (storage.foldername(name))[2] in (
      select id::text from public.clients where user_id = auth.uid()
    )
  );

-- Clients: overwrite (upsert) their own files
create policy "clients: update own docs"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'clients'
    and (storage.foldername(name))[2] in (
      select id::text from public.clients where user_id = auth.uid()
    )
  );

-- Clients: read their own files (needed for signed URL generation)
create policy "clients: read own docs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'clients'
    and (storage.foldername(name))[2] in (
      select id::text from public.clients where user_id = auth.uid()
    )
  );

-- Staff / admin: full access to everything in the bucket
create policy "staff: all docs"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'documents'
    and public.auth_role() not in ('client', 'circle')
  );

-- Circle members: read their own files
create policy "circle: read own docs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'circle'
    and (storage.foldername(name))[2] in (
      select id::text from public.circle_members where user_id = auth.uid()
    )
  );
