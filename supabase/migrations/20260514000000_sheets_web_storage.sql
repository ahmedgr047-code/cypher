-- بديل عن تلغرام: رفع الشيتات من الموقع إلى Storage ثم تسجيلها في telegram_sheets

alter table public.telegram_sheets
  add column if not exists storage_object_path text;

comment on column public.telegram_sheets.storage_object_path is 'مسار الملف في bucket sheets عند الرفع من الويب';

alter table public.telegram_sheets alter column telegram_file_id drop not null;
alter table public.telegram_sheets alter column telegram_file_unique_id drop not null;

alter table public.telegram_sheets drop constraint if exists telegram_sheets_source_chk;
alter table public.telegram_sheets add constraint telegram_sheets_source_chk check (
  (
    storage_object_path is not null
    and length(trim(storage_object_path)) > 0
  )
  or (
    telegram_file_id is not null
    and length(trim(telegram_file_id)) > 0
    and telegram_file_unique_id is not null
    and length(trim(telegram_file_unique_id)) > 0
  )
);

insert into storage.buckets (id, name, public)
values ('sheets', 'sheets', false)
on conflict (id) do nothing;

drop policy if exists "sheets_objects_select_authenticated" on storage.objects;
create policy "sheets_objects_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'sheets');

drop policy if exists "sheets_objects_insert_own_folder" on storage.objects;
create policy "sheets_objects_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'sheets'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "sheets_objects_update_own_folder" on storage.objects;
create policy "sheets_objects_update_own_folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'sheets'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "sheets_objects_delete_own_folder" on storage.objects;
create policy "sheets_objects_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'sheets'
    and split_part(name, '/', 1) = auth.uid()::text
  );
