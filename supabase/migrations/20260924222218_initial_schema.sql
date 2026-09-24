-- Esquema inicial de FC GOAT Tracker.
--
-- El historial de partidos es la única fuente de verdad: ranking, victorias,
-- K.O. y puntos GOAT se derivan de `matches` en la app. No se persisten
-- contadores. `Session.matchIds` tampoco se guarda: se deriva de
-- `matches.session_id`.
--
-- Los ids son `text` para conservar los ids actuales (`p-ace`, `m-1`...).
--
-- Acceso: mientras no exista Supabase Auth, `anon` y `authenticated` solo
-- pueden leer. Las escrituras pasan por el servidor con la service role key,
-- que ignora RLS.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.seasons (
  id text primary key default gen_random_uuid()::text,
  year integer not null unique,
  name text not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Solo puede haber una temporada activa.
create unique index seasons_single_active_idx on public.seasons (active) where active;

create table public.players (
  id text primary key default gen_random_uuid()::text,
  name text not null check (length(trim(name)) > 0),
  handle text not null unique,
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  initials text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.sessions (
  id text primary key default gen_random_uuid()::text,
  name text not null check (length(trim(name)) > 0),
  date date not null,
  season integer not null references public.seasons (year) on update cascade,
  created_by text not null references public.players (id),
  created_at timestamptz not null default now(),
  -- Permite que `matches` exija que su temporada coincida con la de la sesión.
  unique (id, season)
);

create table public.matches (
  id text primary key default gen_random_uuid()::text,
  player1_id text not null references public.players (id),
  player2_id text not null references public.players (id),
  score1 integer not null check (score1 >= 0),
  score2 integer not null check (score2 >= 0),
  mode text not null default 'squad' check (mode in ('global95', 'ultimate', 'squad')),
  season integer not null references public.seasons (year) on update cascade,
  session_id text,
  notes text,
  evidence_url text,
  created_by text not null references public.players (id),
  created_at timestamptz not null default now(),
  check (player1_id <> player2_id),
  foreign key (session_id, season)
    references public.sessions (id, season)
    on update cascade
    on delete set null (session_id)
);

-- Fila única de configuración (id siempre true).
create table public.app_settings (
  id boolean primary key default true check (id),
  app_name text not null,
  group_name text not null,
  active_season_id text not null references public.seasons (id),
  win_points integer not null default 3,
  draw_points integer not null default 1,
  loss_points integer not null default 0,
  ko_goal_difference integer not null default 5 check (ko_goal_difference > 0),
  ko_bonus_points integer not null default 2,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Índices para FKs y consultas frecuentes
-- ---------------------------------------------------------------------------

create index matches_player1_id_idx on public.matches (player1_id);
create index matches_player2_id_idx on public.matches (player2_id);
create index matches_session_id_idx on public.matches (session_id, season);
create index matches_season_idx on public.matches (season);
create index matches_created_by_idx on public.matches (created_by);
create index matches_created_at_idx on public.matches (created_at desc);
create index sessions_season_idx on public.sessions (season);
create index sessions_created_by_idx on public.sessions (created_by);
create index app_settings_active_season_id_idx on public.app_settings (active_season_id);

-- ---------------------------------------------------------------------------
-- RLS y permisos
-- ---------------------------------------------------------------------------

alter table public.seasons enable row level security;
alter table public.players enable row level security;
alter table public.sessions enable row level security;
alter table public.matches enable row level security;
alter table public.app_settings enable row level security;

revoke all on public.seasons, public.players, public.sessions, public.matches, public.app_settings
  from anon, authenticated;
grant select on public.seasons, public.players, public.sessions, public.matches, public.app_settings
  to anon, authenticated;
grant all on public.seasons, public.players, public.sessions, public.matches, public.app_settings
  to service_role;

create policy "Lectura pública de temporadas" on public.seasons
  for select to anon, authenticated using (true);
create policy "Lectura pública de jugadores" on public.players
  for select to anon, authenticated using (true);
create policy "Lectura pública de sesiones" on public.sessions
  for select to anon, authenticated using (true);
create policy "Lectura pública de partidos" on public.matches
  for select to anon, authenticated using (true);
create policy "Lectura pública de configuración" on public.app_settings
  for select to anon, authenticated using (true);
