import { cn } from "@/lib/utils";
import type { Player } from "@/types";

const SIZES = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
} as const;

interface PlayerAvatarProps {
  player: Pick<Player, "name" | "initials" | "color">;
  size?: keyof typeof SIZES;
  className?: string;
}

export function PlayerAvatar({ player, size = "md", className }: PlayerAvatarProps) {
  return (
    <span
      role="img"
      aria-label={player.name}
      title={player.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight text-black/85 ring-1 ring-white/10",
        SIZES[size],
        className
      )}
      style={{ backgroundColor: player.color }}
    >
      {player.initials}
    </span>
  );
}
