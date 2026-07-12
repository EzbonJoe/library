-- Adds real image upload for book covers via Supabase Storage, replacing the old
-- "type the path to a file you manually placed in images/" workflow.
-- Run once in the Supabase SQL Editor, same as the previous migrations.

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Public (anon) can view covers -- needed so visitors' browsers can load the images.
create policy "public read covers" on storage.objects
for select using (bucket_id = 'covers');

-- Only the logged-in admin can upload/replace/remove covers.
create policy "authenticated upload covers" on storage.objects
for insert to authenticated with check (bucket_id = 'covers');

create policy "authenticated update covers" on storage.objects
for update to authenticated using (bucket_id = 'covers') with check (bucket_id = 'covers');

create policy "authenticated delete covers" on storage.objects
for delete to authenticated using (bucket_id = 'covers');
