-- Supabase Auth: cada cuenta reclama un jugador y las escrituras pasan por
-- RLS con la sesión del usuario (ya no por la service role).
--
-- Reglas:
--   * Leer: público (anon y authenticated).
--   * Registrar partidos y sesiones: cualquier cuenta con jugador vinculado.
--     `created_by` lo pone la base con el jugador de la sesión.
--   * Editar o borrar un partido: quien lo registró o uno de los dos jugadores.
--   * Configuración: cualquier cuenta con jugador vinculado.
--   * Reclamar jugador: solo uno sin dueño, y una cuenta solo puede tener uno.

-- ---------------------------------------------------------------------------
-- Vínculo jugador ↔ cuenta
-- ---------------------------------------------------------------------------

alter table public.players
  add column user_id uuid unique references auth.users (id) on delete set null,
  add column claimed boolean generated always as (user_id is not null) stored;

-- Jugador de la sesión actual, o null si no hay sesión o no ha reclamado.
create function public.current_player_id()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select id from public.players where user_id = (select auth.uid())
$$;

revoke execute on function public.current_player_id() from public, anon;
grant execute on function public.current_player_id() to authenticated;

alter table public.matches alter column created_by set default public.current_player_id();
alter table public.sessions alter column created_by set default public.current_player_id();

-- ---------------------------------------------------------------------------
-- Permisos por columna
-- ---------------------------------------------------------------------------

-- `anon` no ve qué cuenta es dueña de cada jugador, solo si está reclamado.
revoke select on public.players from anon;
grant select (id, name, handle, color, initials, active, created_at, claimed) on public.players to anon;

grant update (user_id) on public.players to authenticated;

-- `created_by`, `id` y `created_at` los pone la base; no se pueden enviar.
grant insert (player1_id, player2_id, score1, score2, mode, season, session_id, notes, evidence_url)
  on public.matches to authenticated;
grant update (player1_id, player2_id, score1, score2, mode, season, session_id, notes, evidence_url)
  on public.matches to authenticated;
grant delete on public.matches to authenticated;

grant insert (name, date, season) on public.sessions to authenticated;

grant update (app_name, group_name, active_season_id, win_points, draw_points, loss_points,
  ko_goal_difference, ko_bonus_points, updated_at)
  on public.app_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Políticas
-- ---------------------------------------------------------------------------

create policy "Reclamar un jugador sin dueño" on public.players
  for update to authenticated
  using (user_id is null)
  with check (user_id = (select auth.uid()));

create policy "Miembros registran partidos" on public.matches
  for insert to authenticated
  with check (created_by = (select public.current_player_id()));

create policy "Autor o jugadores editan el partido" on public.matches
  for update to authenticated
  using ((select public.current_player_id()) in (created_by, player1_id, player2_id))
  with check ((select public.current_player_id()) in (created_by, player1_id, player2_id));

create policy "Autor o jugadores borran el partido" on public.matches
  for delete to authenticated
  using ((select public.current_player_id()) in (created_by, player1_id, player2_id));

create policy "Miembros crean sesiones" on public.sessions
  for insert to authenticated
  with check (created_by = (select public.current_player_id()));

create policy "Miembros editan la configuración" on public.app_settings
  for update to authenticated
  using ((select public.current_player_id()) is not null)
  with check ((select public.current_player_id()) is not null);
