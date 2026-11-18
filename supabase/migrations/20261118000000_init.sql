-- supabase/migrations/20261118000000_init.sql
-- CartaAI v2: skema awal. Idempoten sebisanya; jalankan pada project Supabase baru.

-- ---------------------------------------------------------------- utilitas
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_full_name_len check (full_name is null or char_length(full_name) <= 100)
);
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    ), 100),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- style_presets
create table public.style_presets (
  id            text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name          text not null,
  description   text,
  brief         text not null,
  preview_url   text,
  premium_only  boolean not null default false,
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

insert into public.style_presets (id, name, description, brief, premium_only, sort_order) values
  ('default', 'Editorial Romantis', 'Gaya bawaan: hangat, rapi, elegan.',
   'Editorial-romantis. Latar ivory/kertas hangat, teks tinta gelap (hijau tua atau cokelat tua), satu warna aksen (terracotta atau emas pudar). Tipografi: serif display (Fraunces atau Cormorant Garamond) untuk judul dan nama, sans bersih (Inter) untuk isi. Banyak ruang kosong, garis tipis, ornamen minimal. Jangan gunakan gradien ungu/biru.',
   false, 0),
  ('elegan', 'Elegan', 'Mewah dengan aksen emas dan serif klasik.',
   'Elegan dan mewah. Palet gading/krem atau hitam pekat dengan aksen emas pudar, ornamen garis halus dan bingkai tipis. Tipografi: serif klasik (Cormorant Garamond atau Playfair Display) untuk judul, sans ringan untuk isi. Suasana hangat, berkelas, tidak ramai.',
   true, 2),
  ('formal', 'Formal', 'Resmi, rapi, dan profesional.',
   'Formal dan tertata. Palet navy/hijau tua dengan putih gading, aksen satu warna tegas. Tata letak simetris, bingkai rapi, hierarki jelas. Tipografi: serif tegas (Libre Baskerville) untuk judul, sans bersih (Inter) untuk isi.',
   true, 3),
  ('simple', 'Simple', 'Bersih, minimalis, banyak ruang kosong.',
   'Minimalis modern. Latar putih/abu sangat muda, teks gelap, satu warna aksen lembut (pastel). Banyak ruang kosong, tanpa ornamen berat, sudut membulat halus. Tipografi: sans geometris (Poppins atau Inter) dengan satu serif display untuk nama.',
   true, 4),
  ('bebas', 'Bebas', 'AI menentukan gaya dari tema warna yang kamu tulis.',
   'Tentukan sendiri palet, mood, dan tipografi berdasarkan tema warna dan catatan gaya dari pengguna. Pertahankan keterbacaan (kontras teks cukup) dan nuansa elegan untuk pernikahan.',
   true, 9)
on conflict (id) do nothing;
-- Preset lain: ditambah lewat dashboard Supabase atau migrasi baru (Q23).

-- ---------------------------------------------------------------- invitations
create table public.invitations (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references public.profiles(id) on delete cascade,
  slug                 text not null,
  title                text not null,
  data                 jsonb not null default '{}'::jsonb,
  preset_id            text not null default 'default' references public.style_presets(id),
  plan                 text not null default 'free',
  status               text not null default 'draft',
  generations_used     int  not null default 0,
  current_version_id   uuid,
  previous_version_id  uuid,
  published_at         timestamptz,
  expires_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint invitations_slug_format check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 40),
  constraint invitations_title_len check (char_length(title) between 1 and 120),
  constraint invitations_plan_valid check (plan in ('free', 'premium')),
  constraint invitations_status_valid check (status in ('draft', 'published')),
  constraint invitations_generations_nonneg check (generations_used >= 0)
);
create unique index invitations_slug_key on public.invitations (slug);
create index invitations_owner_created_idx on public.invitations (owner_id, created_at desc);
create index invitations_preset_idx on public.invitations (preset_id);
create trigger invitations_set_updated_at before update on public.invitations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- invitation_versions
create table public.invitation_versions (
  id              uuid primary key default gen_random_uuid(),
  invitation_id   uuid not null references public.invitations(id) on delete cascade,
  version_no      int  not null check (version_no > 0),
  html            text not null check (char_length(html) between 1 and 600000),
  model           text not null,
  preset_id       text,
  input_snapshot  jsonb not null,
  warnings        jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  unique (invitation_id, version_no)
);

alter table public.invitations
  add constraint invitations_current_version_fk
    foreign key (current_version_id) references public.invitation_versions(id) on delete set null,
  add constraint invitations_previous_version_fk
    foreign key (previous_version_id) references public.invitation_versions(id) on delete set null;
create index invitations_current_version_idx on public.invitations (current_version_id);
create index invitations_previous_version_idx on public.invitations (previous_version_id);

-- ---------------------------------------------------------------- invitation_assets
create table public.invitation_assets (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid not null references public.invitations(id) on delete cascade,
  kind           text not null check (kind in ('cover', 'groom', 'bride', 'gallery', 'music')),
  storage_path   text not null unique,
  content_type   text not null,
  size_bytes     bigint not null check (size_bytes > 0),
  position       int not null default 0,
  status         text not null default 'pending' check (status in ('pending', 'ready')),
  created_at     timestamptz not null default now()
);
create unique index invitation_assets_single_kind
  on public.invitation_assets (invitation_id, kind) where kind <> 'gallery' and status = 'ready';
create index invitation_assets_invitation_idx on public.invitation_assets (invitation_id);
create index invitation_assets_pending_idx
  on public.invitation_assets (created_at) where status = 'pending';

-- ---------------------------------------------------------------- guests
create table public.guests (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid not null references public.invitations(id) on delete cascade,
  name           text not null check (char_length(btrim(name)) between 1 and 100),
  name_key       text generated always as (lower(btrim(name))) stored,
  phone          text check (phone is null or phone ~ '^\+?[0-9]{8,15}$'),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index guests_invitation_name_key on public.guests (invitation_id, name_key);
create trigger guests_set_updated_at before update on public.guests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- rsvps
create table public.rsvps (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid not null references public.invitations(id) on delete cascade,
  guest_id       uuid references public.guests(id) on delete set null,
  guest_name     text not null check (char_length(btrim(guest_name)) between 1 and 100),
  name_key       text generated always as (lower(btrim(guest_name))) stored,
  attendance     text not null check (attendance in ('hadir', 'tidak_hadir')),
  message        text check (message is null or char_length(message) <= 500),
  is_hidden      boolean not null default false,
  created_at     timestamptz not null default now()
);
create index rsvps_invitation_created_idx on public.rsvps (invitation_id, created_at desc);
create index rsvps_invitation_name_idx on public.rsvps (invitation_id, name_key, created_at desc);
create index rsvps_guest_idx on public.rsvps (guest_id);

-- ---------------------------------------------------------------- orders
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  midtrans_order_id   text not null unique,
  invitation_id       uuid not null references public.invitations(id) on delete cascade,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  amount              int  not null check (amount > 0),
  status              text not null default 'pending'
                      check (status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  snap_token          text,
  redirect_url        text,
  payment_type        text,
  transaction_id      text,
  transaction_status  text,
  fraud_status        text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index orders_invitation_idx on public.orders (invitation_id);
create unique index orders_one_pending_per_invitation
  on public.orders (invitation_id) where status = 'pending';
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- payment_events
create table public.payment_events (
  id                 bigint generated always as identity primary key,
  midtrans_order_id  text,
  source             text not null check (source in ('webhook', 'sync')),
  payload            jsonb not null,
  created_at         timestamptz not null default now()
);
create index payment_events_order_idx on public.payment_events (midtrans_order_id);

-- ---------------------------------------------------------------- generation_jobs
create table public.generation_jobs (
  id                 uuid primary key default gen_random_uuid(),
  invitation_id      uuid not null references public.invitations(id) on delete cascade,
  user_id            uuid not null references public.profiles(id) on delete cascade,
  status             text not null default 'queued'
                     check (status in ('queued', 'running', 'succeeded', 'failed')),
  stage              text not null default 'queued'
                     check (stage in ('queued', 'validating', 'prompting', 'generating',
                                      'sanitizing', 'injecting', 'saving', 'done')),
  attempt            int  not null default 0,
  error_code         text,
  error_message      text,
  input_snapshot     jsonb not null,
  result_version_id  uuid references public.invitation_versions(id) on delete set null,
  heartbeat_at       timestamptz not null default now(),
  started_at         timestamptz,
  finished_at        timestamptz,
  created_at         timestamptz not null default now()
);
create unique index generation_jobs_one_active_per_invitation
  on public.generation_jobs (invitation_id) where status in ('queued', 'running');
create index generation_jobs_invitation_created_idx
  on public.generation_jobs (invitation_id, created_at desc);
create index generation_jobs_recovery_idx
  on public.generation_jobs (status, heartbeat_at) where status in ('queued', 'running');
create index generation_jobs_user_idx on public.generation_jobs (user_id);
create index generation_jobs_result_version_idx on public.generation_jobs (result_version_id);

-- ---------------------------------------------------------------- chat_usage
create table public.chat_usage (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  day      date not null,
  count    int  not null default 0 check (count >= 0),
  primary key (user_id, day)
);

-- ================================================================ fungsi (hanya service_role)

-- Menyimpan hasil generate: versi baru, penunjuk versi, kuota, status job. Idempoten per job.
create or replace function public.commit_generation(
  p_job_id uuid, p_html text, p_model text, p_warnings jsonb, p_free_days int default 30
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_job public.generation_jobs%rowtype;
  v_inv public.invitations%rowtype;
  v_version_id uuid;
  v_next int;
begin
  select * into v_job from public.generation_jobs where id = p_job_id for update;
  if not found then raise exception 'job_not_found'; end if;
  if v_job.status = 'succeeded' then return v_job.result_version_id; end if;
  if v_job.status <> 'running' then raise exception 'job_not_running'; end if;

  select * into v_inv from public.invitations where id = v_job.invitation_id for update;

  select coalesce(max(version_no), 0) + 1 into v_next
    from public.invitation_versions where invitation_id = v_inv.id;

  insert into public.invitation_versions
    (invitation_id, version_no, html, model, preset_id, input_snapshot, warnings)
  values
    (v_inv.id, v_next, p_html, p_model, v_job.input_snapshot->>'preset_id',
     v_job.input_snapshot, coalesce(p_warnings, '[]'::jsonb))
  returning id into v_version_id;

  update public.invitations set
    previous_version_id = current_version_id,
    current_version_id  = v_version_id,
    generations_used    = generations_used + 1,
    status              = 'published',
    published_at        = coalesce(published_at, now()),
    expires_at          = case when plan = 'free' and expires_at is null
                               then now() + make_interval(days => p_free_days)
                               else expires_at end
  where id = v_inv.id;

  -- simpan hanya versi baru + versi sebelumnya (Q16)
  delete from public.invitation_versions
   where invitation_id = v_inv.id
     and id <> v_version_id
     and id is distinct from v_inv.current_version_id;

  update public.generation_jobs set
    status = 'succeeded', stage = 'done', result_version_id = v_version_id,
    finished_at = now(), heartbeat_at = now()
  where id = p_job_id;

  return v_version_id;
end $$;

-- Rollback: tukar versi aktif dan sebelumnya. Memeriksa pemilik.
create or replace function public.rollback_invitation(p_invitation_id uuid, p_owner_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_inv public.invitations%rowtype;
begin
  select * into v_inv from public.invitations
   where id = p_invitation_id and owner_id = p_owner_id for update;
  if not found then raise exception 'not_found'; end if;
  if v_inv.previous_version_id is null then raise exception 'no_previous_version'; end if;
  update public.invitations set
    current_version_id = v_inv.previous_version_id,
    previous_version_id = v_inv.current_version_id
  where id = v_inv.id;
end $$;

-- Menandai order lunas dan menjadikan undangan premium. Idempoten: true hanya pada transisi pertama.
create or replace function public.mark_order_paid(
  p_midtrans_order_id text, p_transaction_id text, p_payment_type text,
  p_fraud_status text, p_premium_days int default 365
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_invitation uuid;
begin
  update public.orders set
    status = 'paid', paid_at = now(),
    transaction_status = 'settlement',
    transaction_id = coalesce(p_transaction_id, transaction_id),
    payment_type   = coalesce(p_payment_type, payment_type),
    fraud_status   = coalesce(p_fraud_status, fraud_status)
  where midtrans_order_id = p_midtrans_order_id and status = 'pending'
  returning invitation_id into v_invitation;
  if not found then return false; end if;

  update public.invitations set
    plan = 'premium',
    expires_at = now() + make_interval(days => p_premium_days)
  where id = v_invitation;
  return true;
end $$;

-- Kuota chat harian (hari WIB). Mengembalikan sisa kuota, atau -1 bila habis.
create or replace function public.consume_chat_quota(p_user_id uuid, p_limit int)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_day date := (now() at time zone 'Asia/Jakarta')::date;
  v_count int;
begin
  insert into public.chat_usage (user_id, day, count) values (p_user_id, v_day, 0)
    on conflict (user_id, day) do nothing;
  update public.chat_usage set count = count + 1
   where user_id = p_user_id and day = v_day and count < p_limit
  returning count into v_count;
  if not found then return -1; end if;
  return p_limit - v_count;
end $$;

create or replace function public.refund_chat_quota(p_user_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.chat_usage set count = greatest(count - 1, 0)
   where user_id = p_user_id and day = (now() at time zone 'Asia/Jakarta')::date;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.commit_generation(uuid, text, text, jsonb, int) from public, anon, authenticated;
revoke all on function public.rollback_invitation(uuid, uuid)                 from public, anon, authenticated;
revoke all on function public.mark_order_paid(text, text, text, text, int)    from public, anon, authenticated;
revoke all on function public.consume_chat_quota(uuid, int)                   from public, anon, authenticated;
revoke all on function public.refund_chat_quota(uuid)                         from public, anon, authenticated;
grant execute on function public.commit_generation(uuid, text, text, jsonb, int) to service_role;
grant execute on function public.rollback_invitation(uuid, uuid)                 to service_role;
grant execute on function public.mark_order_paid(text, text, text, text, int)    to service_role;
grant execute on function public.consume_chat_quota(uuid, int)                   to service_role;
grant execute on function public.refund_chat_quota(uuid)                         to service_role;

-- ================================================================ RLS
alter table public.profiles            enable row level security;
alter table public.style_presets       enable row level security;
alter table public.invitations         enable row level security;
alter table public.invitation_versions enable row level security;
alter table public.invitation_assets   enable row level security;
alter table public.guests              enable row level security;
alter table public.rsvps               enable row level security;
alter table public.orders              enable row level security;
alter table public.payment_events      enable row level security;
alter table public.generation_jobs     enable row level security;
alter table public.chat_usage          enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy style_presets_select_active on public.style_presets
  for select to anon, authenticated using (is_active);

create policy invitations_select_own on public.invitations
  for select to authenticated using (owner_id = (select auth.uid()));

create policy invitation_versions_select_own on public.invitation_versions
  for select to authenticated using (exists (
    select 1 from public.invitations i
     where i.id = invitation_id and i.owner_id = (select auth.uid())));

create policy invitation_assets_select_own on public.invitation_assets
  for select to authenticated using (exists (
    select 1 from public.invitations i
     where i.id = invitation_id and i.owner_id = (select auth.uid())));

create policy guests_select_own on public.guests
  for select to authenticated using (exists (
    select 1 from public.invitations i
     where i.id = invitation_id and i.owner_id = (select auth.uid())));

create policy rsvps_select_own on public.rsvps
  for select to authenticated using (exists (
    select 1 from public.invitations i
     where i.id = invitation_id and i.owner_id = (select auth.uid())));

create policy orders_select_own on public.orders
  for select to authenticated using (user_id = (select auth.uid()));

create policy generation_jobs_select_own on public.generation_jobs
  for select to authenticated using (user_id = (select auth.uid()));

-- payment_events dan chat_usage: tanpa kebijakan (tertutup untuk anon/authenticated)

-- Hak tabel: klien tidak boleh menulis kecuali profil (kolom terbatas)
revoke insert, update, delete on all tables in schema public from anon, authenticated;
revoke all on public.payment_events, public.chat_usage from anon, authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- ================================================================ Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invitation-assets', 'invitation-assets', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
-- Sengaja TANPA kebijakan di storage.objects: tulis hanya via signed upload URL / service-role.
