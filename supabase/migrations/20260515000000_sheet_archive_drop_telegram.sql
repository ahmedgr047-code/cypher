-- أرشيف الشيتات (Supabase Storage فقط). إزالة اعتماد telegram_sheets.

create table if not exists public.sheet_archive (
  id uuid primary key default gen_random_uuid(),
  storage_object_path text not null,
  file_name text,
  caption text,
  mime_type text,
  file_size bigint,
  created_at timestamptz default now() not null,
  constraint sheet_archive_path_unique unique (storage_object_path)
);

create index if not exists sheet_archive_search_idx
  on public.sheet_archive using gin (
    (to_tsvector('simple', coalesce(file_name, '') || ' ' || coalesce(caption, '')))
  );

alter table public.sheet_archive enable row level security;

drop policy if exists "sheet_archive_select_authenticated" on public.sheet_archive;
create policy "sheet_archive_select_authenticated"
  on public.sheet_archive for select
  to authenticated
  using (true);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'telegram_sheets'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'telegram_sheets'
      and column_name = 'storage_object_path'
  ) then
    insert into public.sheet_archive (id, storage_object_path, file_name, caption, mime_type, file_size, created_at)
    select
      ts.id,
      ts.storage_object_path,
      ts.file_name,
      ts.caption,
      ts.mime_type,
      ts.file_size,
      ts.created_at
    from public.telegram_sheets as ts
    where ts.storage_object_path is not null
      and length(trim(ts.storage_object_path)) > 0
    on conflict (storage_object_path) do nothing;
  end if;
end $$;

drop table if exists public.telegram_sheets cascade;
