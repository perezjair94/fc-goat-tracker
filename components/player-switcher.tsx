"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerAvatar } from "@/components/player-avatar";
import { useCurrentPlayer } from "@/hooks/use-current-player";
import { useFcStore } from "@/hooks/use-fc-store";
import { getActivePlayers } from "@/lib/services/fc-service";

/**
 * Sustituto local del "quién soy" hasta que exista Supabase Auth: cada
 * partido registrado usa este jugador como `createdBy` en vez de un valor
 * fijo en el código.
 */
export function PlayerSwitcher() {
  const { data: players } = useFcStore(getActivePlayers);
  const { currentPlayerId, setCurrentPlayerId } = useCurrentPlayer();

  const current = players?.find((p) => p.id === currentPlayerId);
  if (!players || !current) return null;

  return (
    <Select value={currentPlayerId ?? undefined} onValueChange={(value) => value && setCurrentPlayerId(value)}>
      <SelectTrigger size="sm" className="w-auto gap-2 border-none bg-transparent shadow-none hover:bg-white/5">
        <PlayerAvatar player={current} size="sm" />
        <SelectValue>
          <span className="hidden text-sm font-medium sm:inline">{current.name}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {players.map((player) => (
          <SelectItem key={player.id} value={player.id}>
            <span className="flex items-center gap-2">
              <PlayerAvatar player={player} size="sm" />
              {player.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
