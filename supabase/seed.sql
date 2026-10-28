-- Datos iniciales: temporadas y configuración, igual que `DEFAULT_SETTINGS`
-- en `lib/data/store.ts`. Sin jugadores ni partidos: cada jugador se crea
-- al registrarse.

-- Las temporadas de la app solo se pueden programar a futuro; el seed carga
-- también las que ya empezaron.
alter table public.seasons disable trigger seasons_prepare_new;

insert into public.seasons (id, number, name, starts_on) values
  ('season-2026', 1, 'Temporada 1', '2026-09-24'),
  ('season-2', 2, 'Temporada 2', '2026-10-24')
on conflict (id) do nothing;

alter table public.seasons enable trigger seasons_prepare_new;

insert into public.app_settings (app_name, group_name) values
  ('FC GOAT Tracker', 'Los Panas FC');
