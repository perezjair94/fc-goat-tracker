-- Datos iniciales: temporada activa y configuración, igual que
-- `DEFAULT_SETTINGS` en `lib/data/store.ts`. Sin jugadores ni partidos:
-- cada jugador se crea al registrarse.

insert into public.seasons (id, year, name, active) values
  ('season-2026', 2026, 'Temporada 2026', true);

insert into public.app_settings (app_name, group_name, active_season_id) values
  ('FC GOAT Tracker', 'Los Panas FC', 'season-2026');
