-- Cypher — جداول Supabase الكاملة
-- الصق في: Supabase Dashboard → SQL Editor → New query → Run
-- ملاحظة: إن ظهر خطأ في `execute function` جرّب استبداله بـ `execute procedure` (إصدارات قديمة من PostgreSQL)

-- ─── profiles ───
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  student_id text,
  updated_at timestamptz default now() not null
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── conversations ───
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'محادثة جديدة',
  preview text not null default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists conversations_user_id_idx on public.conversations (user_id, updated_at desc);

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;

drop policy if exists "conversations_select_own" on public.conversations;
create policy "conversations_select_own"
  on public.conversations for select
  using (auth.uid() = user_id);

drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own"
  on public.conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "conversations_update_own" on public.conversations;
create policy "conversations_update_own"
  on public.conversations for update
  using (auth.uid() = user_id);

drop policy if exists "conversations_delete_own" on public.conversations;
create policy "conversations_delete_own"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- ─── messages ───
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null default '',
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

create or replace function public.touch_conversation_on_message()
returns trigger as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

alter table public.messages enable row level security;

drop policy if exists "messages_select_via_conversation" on public.messages;
create policy "messages_select_via_conversation"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "messages_insert_via_conversation" on public.messages;
create policy "messages_insert_via_conversation"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- ─── quick_chips ───
create table if not exists public.quick_chips (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sort_order int not null default 0,
  constraint quick_chips_label_key unique (label)
);

alter table public.quick_chips enable row level security;

drop policy if exists "quick_chips_select_authenticated" on public.quick_chips;
create policy "quick_chips_select_authenticated"
  on public.quick_chips for select
  to authenticated
  using (true);

-- ─── subjects_catalog ───
create table if not exists public.subjects_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  semester text not null,
  sort_order int not null default 0
);

alter table public.subjects_catalog enable row level security;

drop policy if exists "subjects_select_authenticated" on public.subjects_catalog;
create policy "subjects_select_authenticated"
  on public.subjects_catalog for select
  to authenticated
  using (true);

-- ─── telegram_sheets (إدراج عبر service role / webhook فقط) ───
create table if not exists public.telegram_sheets (
  id uuid primary key default gen_random_uuid(),
  telegram_file_id text not null,
  telegram_file_unique_id text not null,
  file_name text,
  caption text,
  mime_type text,
  file_size bigint,
  channel_id bigint not null,
  message_id bigint not null,
  created_at timestamptz default now() not null,
  unique (channel_id, message_id)
);

create index if not exists telegram_sheets_search_idx
  on public.telegram_sheets using gin (
    (to_tsvector('simple', coalesce(file_name, '') || ' ' || coalesce(caption, '')))
  );

alter table public.telegram_sheets enable row level security;

drop policy if exists "telegram_sheets_select_authenticated" on public.telegram_sheets;
create policy "telegram_sheets_select_authenticated"
  on public.telegram_sheets for select
  to authenticated
  using (true);

-- ─── بيانات أولية (يمكن إعادة التشغيل بأمان) ───
insert into public.quick_chips (label, sort_order)
values
  ('اطلب شيتاً بذكر اسم المادة (مثال: قواعد البيانات)', 10),
  ('لخّص لي محاضرة للمراجعة السريعة قبل الامتحان', 20),
  ('اشرح لي موضوعاً من منهج المعهد خطوة بخطوة', 30),
  ('هل يوجد شيت متاح لهذه المادة في النظام؟', 40),
  ('كيف أحمّل الشيت إذا ظهرت بطاقة التحميل؟', 50),
  ('نصائح مذاكرة لمقرر صعب', 60)
on conflict (label) do nothing;

insert into public.subjects_catalog (code, name, semester, sort_order)
values
  ('MATH-201', 'الرياضيات التطبيقية', 'الفصل الثاني', 10),
  ('PHYS-301', 'فيزياء الصلبة', 'الفصل الأول', 20),
  ('CHEM-202', 'الكيمياء العضوية', 'الفصل الثاني', 30),
  ('CS-301', 'البرمجة الكائنية OOP', 'الفصل الثاني', 40),
  ('STAT-201', 'الإحصاء التطبيقي', 'الفصل الثاني', 50),
  ('DB-401', 'قواعد البيانات المتقدمة', 'الفصل الأول', 60)
on conflict (code) do nothing;
