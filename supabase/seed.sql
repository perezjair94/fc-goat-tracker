-- Datos iniciales, equivalentes a `lib/data/store.ts`.

insert into public.seasons (id, year, name, active) values
  ('season-2026', 2026, 'Temporada 2026', true);

insert into public.players (id, name, handle, color, initials, active, created_at) values
  ('p-ace', 'Ace', '@ace', '#d4ff45', 'AC', true, '2026-01-05T10:00:00.000Z'),
  ('p-blaze',   'Blaze',   '@blaze',   '#ff8069', 'BL', true, '2026-01-05T10:00:00.000Z'),
  ('p-cobra',  'Cobra',  '@cobra',  '#5ab0ff', 'CO', true, '2026-01-05T10:00:00.000Z'),
  ('p-drako',  'Drako',  '@drako',  '#ffb84d', 'DR', true, '2026-01-05T10:00:00.000Z'),
  ('p-echo',  'Echo',  '@echo',  '#c792ff', 'EC', true, '2026-01-05T10:00:00.000Z'),
  ('p-fenix',   'Fenix',   '@fenix',   '#4dd4c0', 'FE', true, '2026-01-05T10:00:00.000Z'),
  ('p-ghost', 'Ghost', '@ghost', '#ff6ea8', 'GH', true, '2026-01-05T10:00:00.000Z'),
  ('p-hawk',  'Hawk',  '@hawk',  '#b8e944', 'HA', true, '2026-01-05T10:00:00.000Z');

insert into public.sessions (id, name, date, season, created_by, created_at) values
  ('session-1', 'Noche de viernes',      '2026-01-09', 2026, 'p-ace', '2026-01-09T20:00:00.000Z'),
  ('session-2', 'Maratón sabatino',      '2026-01-17', 2026, 'p-blaze',   '2026-01-17T16:00:00.000Z'),
  ('session-3', 'Revancha entre semana', '2026-02-04', 2026, 'p-cobra',  '2026-02-04T19:30:00.000Z');

insert into public.matches (id, player1_id, player2_id, score1, score2, mode, season, session_id, notes, created_by, created_at) values
  ('m-1',  'p-ace', 'p-blaze',   4, 1, 'squad',    2026, 'session-1', null, 'p-ace', '2026-01-09T20:15:00.000Z'),
  ('m-2',  'p-cobra',  'p-drako',  2, 2, 'squad',    2026, 'session-1', null, 'p-ace', '2026-01-09T20:45:00.000Z'),
  ('m-3',  'p-echo',  'p-fenix',   6, 0, 'global95', 2026, 'session-1', null, 'p-ace', '2026-01-09T21:15:00.000Z'),
  ('m-4',  'p-ghost', 'p-hawk',  3, 1, 'ultimate', 2026, 'session-2', null, 'p-blaze',   '2026-01-17T16:10:00.000Z'),
  ('m-5',  'p-ace', 'p-cobra',  5, 2, 'ultimate', 2026, 'session-2', null, 'p-blaze',   '2026-01-17T16:40:00.000Z'),
  ('m-6',  'p-blaze',   'p-echo',  1, 3, 'squad',    2026, 'session-2', null, 'p-blaze',   '2026-01-17T17:10:00.000Z'),
  ('m-7',  'p-drako',  'p-fenix',   2, 1, 'global95', 2026, 'session-2', null, 'p-blaze',   '2026-01-17T17:45:00.000Z'),
  ('m-8',  'p-ace', 'p-ghost', 3, 0, 'squad',    2026, 'session-3', null, 'p-cobra',  '2026-02-04T19:40:00.000Z'),
  ('m-9',  'p-hawk',  'p-cobra',  2, 2, 'ultimate', 2026, 'session-3', null, 'p-cobra',  '2026-02-04T20:10:00.000Z'),
  ('m-10', 'p-fenix',   'p-echo',  1, 4, 'global95', 2026, 'session-3', null, 'p-cobra',  '2026-02-04T20:40:00.000Z'),
  ('m-11', 'p-ace', 'p-echo',  3, 2, 'squad',    2026, null,        null, 'p-ace', '2026-02-11T18:20:00.000Z'),
  ('m-12', 'p-blaze',   'p-drako',  0, 5, 'ultimate', 2026, null,        'Remontada increíble en el segundo tiempo.', 'p-drako', '2026-02-11T19:00:00.000Z'),
  ('m-13', 'p-ace', 'p-fenix',   2, 1, 'global95', 2026, null,        null, 'p-ace', '2026-02-18T18:30:00.000Z'),
  ('m-14', 'p-ace', 'p-hawk',  4, 2, 'squad',    2026, null,        null, 'p-ace', '2026-02-25T18:00:00.000Z');

insert into public.app_settings (app_name, group_name, active_season_id) values
  ('FC GOAT Tracker', 'Los Panas FC', 'season-2026');
