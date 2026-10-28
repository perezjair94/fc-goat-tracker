-- Temporadas por fechas en vez de una por año.
--
-- Cada temporada tiene un número (1, 2, ...) y un día de inicio; termina el
-- día antes de que empiece la siguiente, así que no hay huecos ni solapes.
-- La temporada actual es la última que ya empezó. Las fechas se cuentan en
-- hora de Bogotá.
--
-- `matches.season` y `sessions.season` pasan a guardar el número de
-- temporada y los pone la base: una sesión según su fecha y un partido según
-- su sesión o, si no tiene, el día en que se registró. La app ya no los
-- envía.
--
-- Producción: la Temporada 1 llega hasta el domingo 25 de octubre de 2026 y
-- la Temporada 2 empieza el lunes 26.
--
-- `seasons.active` y `app_settings.active_season_id` desaparecen: la
-- temporada actual se deriva de las fechas.

-- ---------------------------------------------------------------------------
-- Esquema de temporadas
-- ---------------------------------------------------------------------------

alter table public.matches
  drop constraint matches_season_fkey,
  drop constraint matches_session_id_season_fkey;
alter table public.sessions drop constraint sessions_season_fkey;

alter table public.app_settings drop column active_season_id;

drop index public.seasons_single_active_idx;
alter table public.seasons drop column active;
alter table public.seasons rename column year to number;
alter table public.seasons rename constraint seasons_year_key to seasons_number_key;
alter table public.seasons add column starts_on date;

-- La temporada que había (2026) es la Temporada 1 y empieza con el primer
-- partido o sesión registrados.
update public.seasons
set
  number = 1,
  name = 'Temporada 1',
  starts_on = least(
    date '2026-09-24',
    (select min((created_at at time zone 'America/Bogota')::date) from public.matches),
    (select min(date) from public.sessions)
  )
where number = 2026;

alter table public.seasons
  alter column starts_on set not null,
  add constraint seasons_starts_on_key unique (starts_on),
  add constraint seasons_number_check check (number > 0);

insert into public.seasons (id, number, name, starts_on) values
  ('season-2', 2, 'Temporada 2', date '2026-10-26');

-- ---------------------------------------------------------------------------
-- Temporada de una fecha
-- ---------------------------------------------------------------------------

-- Día de hoy en Bogotá.
create function public.season_today()
returns date
language sql
stable
security invoker
set search_path = ''
as $$
  select (now() at time zone 'America/Bogota')::date
$$;

-- Número de la temporada a la que pertenece un día. Antes de la primera
-- temporada cuenta como la primera.
create function public.season_for(day date)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (select number from public.seasons where starts_on <= day order by starts_on desc limit 1),
    (select min(number) from public.seasons)
  )
$$;

-- ---------------------------------------------------------------------------
-- Reasignar sesiones y partidos existentes
-- ---------------------------------------------------------------------------

update public.sessions set season = public.season_for(date);

-- Un partido va con su sesión aunque se haya registrado otro día.
update public.matches m
set season = coalesce(
  (select s.season from public.sessions s where s.id = m.session_id),
  public.season_for((m.created_at at time zone 'America/Bogota')::date)
);

alter table public.sessions
  add constraint sessions_season_fkey
    foreign key (season) references public.seasons (number) on update cascade;

alter table public.matches
  add constraint matches_season_fkey
    foreign key (season) references public.seasons (number) on update cascade,
  add constraint matches_session_id_season_fkey
    foreign key (session_id, season)
    references public.sessions (id, season)
    on update cascade
    on delete set null (session_id);

-- ---------------------------------------------------------------------------
-- La base asigna la temporada
-- ---------------------------------------------------------------------------

create function public.set_session_season()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.season := public.season_for(new.date);
  return new;
end
$$;

create trigger sessions_set_season
  before insert or update of date on public.sessions
  for each row execute function public.set_session_season();

create function public.set_match_season()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Si la sesión no existe, la FK (session_id, season) rechaza el partido.
  new.season := coalesce(
    (select s.season from public.sessions s where s.id = new.session_id),
    public.season_for((new.created_at at time zone 'America/Bogota')::date)
  );
  return new;
end
$$;

create trigger matches_set_season
  before insert or update of session_id on public.matches
  for each row execute function public.set_match_season();

revoke insert (season), update (season) on public.matches from authenticated;
revoke insert (season) on public.sessions from authenticated;

-- ---------------------------------------------------------------------------
-- Programar temporadas
-- ---------------------------------------------------------------------------

-- Una temporada nueva solo se puede programar a futuro y después de la
-- última; su número es el siguiente. Así nunca hay que mover partidos ya
-- registrados.
create function public.prepare_new_season()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  last_start date;
begin
  select max(starts_on) into last_start from public.seasons;
  if new.starts_on <= public.season_today() then
    raise exception 'La temporada debe empezar después de hoy.' using errcode = '23514';
  end if;
  if new.starts_on <= last_start then
    raise exception 'La temporada debe empezar después de la última.' using errcode = '23514';
  end if;
  new.number := coalesce((select max(number) from public.seasons), 0) + 1;
  return new;
end
$$;

create trigger seasons_prepare_new
  before insert on public.seasons
  for each row execute function public.prepare_new_season();

grant insert (name, starts_on) on public.seasons to authenticated;
grant delete on public.seasons to authenticated;

create policy "Miembros programan temporadas" on public.seasons
  for insert to authenticated
  with check ((select public.current_player_id()) is not null);

-- Solo se puede cancelar la última temporada y si todavía no empezó.
create policy "Miembros cancelan la temporada programada" on public.seasons
  for delete to authenticated
  using (
    (select public.current_player_id()) is not null
    and starts_on > (select public.season_today())
    and number = (select max(s.number) from public.seasons s)
  );
