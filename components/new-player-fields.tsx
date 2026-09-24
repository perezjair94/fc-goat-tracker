"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlayerAvatar } from "@/components/player-avatar";
import { cn } from "@/lib/utils";
import { getPlayerInitials } from "@/types";

export const PLAYER_COLORS = [
  "#d4ff45", "#ff8069", "#5ab0ff", "#ffb84d", "#c792ff", "#4dd4c0", "#ff6ea8",
  "#b8e944", "#f5e663", "#7cf29c", "#ff9f43", "#8ab4ff", "#e879f9", "#94a3b8",
];

/** Primer color de la paleta que ningún jugador usa todavía. */
export function suggestColor(usedColors: string[]): string {
  const used = new Set(usedColors.map((c) => c.toLowerCase()));
  return PLAYER_COLORS.find((c) => !used.has(c)) ?? PLAYER_COLORS[0];
}

export interface NewPlayerValue {
  name: string;
  color: string;
}

/** Nombre y color de un jugador nuevo, con vista previa del avatar. */
export function NewPlayerFields({
  value,
  onChange,
  disabled,
}: {
  value: NewPlayerValue;
  onChange: (value: NewPlayerValue) => void;
  disabled?: boolean;
}) {
  const nameId = useId();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>Tu nombre</Label>
        <div className="flex items-center gap-2">
          <PlayerAvatar
            player={{
              name: value.name || "Nuevo",
              initials: getPlayerInitials(value.name) || "?",
              color: value.color,
            }}
            size="sm"
          />
          <Input
            id={nameId}
            required
            maxLength={40}
            autoComplete="nickname"
            disabled={disabled}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Como te conoce el grupo"
          />
        </div>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Color</legend>
        <div className="flex flex-wrap gap-2">
          {PLAYER_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Color ${color}`}
              aria-pressed={value.color === color}
              disabled={disabled}
              onClick={() => onChange({ ...value, color })}
              className={cn(
                "size-7 rounded-full ring-offset-2 ring-offset-background transition",
                value.color === color ? "ring-2 ring-foreground" : "hover:scale-110"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
