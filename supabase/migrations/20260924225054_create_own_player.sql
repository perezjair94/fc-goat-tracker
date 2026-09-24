-- Una cuenta sin jugador puede crear el suyo (al registrarse o desde
-- /claim). Queda vinculado a la cuenta en el mismo insert, y el unique de
-- `players.user_id` sigue impidiendo tener más de uno.

grant insert (name, handle, color, initials, user_id) on public.players to authenticated;

create policy "Crear tu propio jugador" on public.players
  for insert to authenticated
  with check (user_id = (select auth.uid()));
