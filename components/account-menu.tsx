"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, LogIn, LogOut, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlayerAvatar } from "@/components/player-avatar";
import { useCurrentPlayer } from "@/hooks/use-current-player";
import { useFcStore } from "@/hooks/use-fc-store";
import { getPlayer, signOut } from "@/lib/services/fc-service";

/** Estado de la cuenta en la cabecera: entrar, elegir jugador o menú de cuenta. */
export function AccountMenu() {
  const router = useRouter();
  const { ready, account, currentPlayerId } = useCurrentPlayer();
  const { data: player } = useFcStore(() => (currentPlayerId ? getPlayer(currentPlayerId) : undefined));

  if (!ready) return null;

  if (!account) {
    return (
      <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm" className="gap-1.5">
        <LogIn className="size-4" />
        Iniciar sesión
      </Button>
    );
  }

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Sesión cerrada");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cerrar la sesión.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="gap-2" />}
        aria-label="Menú de cuenta"
      >
        {player ? (
          <>
            <PlayerAvatar player={player} size="sm" />
            <span className="hidden text-sm font-medium sm:inline">{player.name}</span>
          </>
        ) : (
          <span className="text-sm font-medium">Mi cuenta</span>
        )}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-1.5 py-1 text-xs text-muted-foreground">{account.email}</div>
        <DropdownMenuSeparator />
        {!player ? (
          <DropdownMenuItem render={<Link href="/onboarding" />}>
            <UserRoundPlus />
            Crear mi jugador
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
