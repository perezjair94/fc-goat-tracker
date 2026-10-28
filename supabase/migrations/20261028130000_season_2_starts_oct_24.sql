-- La Temporada 2 empieza el sábado 24 de octubre de 2026, no el lunes 26:
-- la Temporada 1 termina el viernes 23. Los partidos y sesiones de esos
-- días pasan a la Temporada 2.

update public.seasons
set starts_on = date '2026-10-24'
where number = 2 and starts_on = date '2026-10-26';

-- Al cambiar la temporada de una sesión, la FK (session_id, season) arrastra
-- sus partidos.
update public.sessions
set season = public.season_for(date)
where season is distinct from public.season_for(date);

update public.matches m
set season = public.season_for((m.created_at at time zone 'America/Bogota')::date)
where m.session_id is null
  and m.season is distinct from public.season_for((m.created_at at time zone 'America/Bogota')::date);
