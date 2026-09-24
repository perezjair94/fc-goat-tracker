-- Ya no se reclaman jugadores existentes: cada cuenta crea el suyo (al
-- registrarse, o después si la cuenta quedó sin jugador). El vínculo
-- `user_id` solo se fija en el insert y no se puede cambiar desde la app.

drop policy "Reclamar un jugador sin dueño" on public.players;
revoke update (user_id) on public.players from authenticated;
