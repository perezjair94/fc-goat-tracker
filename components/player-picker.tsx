"use client";

import { useId } from "react";
import { Check, UserRoundPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlayerAvatar } from "@/components/player-avatar";
import { useFcStore } from "@/hooks/use-fc-store";
import { getPlayers, getUnclaimedPlayers, type PlayerChoice } from "@/lib/services/fc-service";
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

export function isChoiceComplete(choice: PlayerChoice | null): choice is PlayerChoice {
  if (!choice) return false;
  return choice.kind === "existing" || choice.name.trim().length > 0;
}

interface PlayerPickerProps {
  value: PlayerChoice | null;
  onChange: (choice: PlayerChoice) => void;
  disabled?: boolean;
}

/** Elegir un jugador libre o crear uno nuevo. Controlado por `value`. */
export function PlayerPicker({ value, onChange, disabled }: PlayerPickerProps) {
  const { data: unclaimed } = useFcStore(getUnclaimedPlayers);
  const { data: allPlayers } = useFcStore(getPlayers);

  const isNew = value?.kind === "new";
  const newChoice = isNew ? value : null;

  function selectNew() {
    if (isNew) return;
    onChange({ kind: "new", name: "", color: suggestColor(allPlayers?.map((p) => p.color) ?? []) });
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="¿Quién eres?" className="grid gap-2 sm:grid-cols-2">
        {unclaimed?.map((player) => {
          const selected = value?.kind === "existing" && value.playerId === player.id;
          return (
            <button
              key={player.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange({ kind: "existing", playerId: player.id })}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-60",
                selected ? "border-goat-lime bg-goat-lime/10" : "border-border bg-card hover:border-goat-lime/40"
              )}
            >
              <PlayerAvatar player={player} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{player.name}</span>
                <span className="truncate text-xs text-muted-foreground">{player.handle}</span>
              </span>
              {selected ? <Check className="size-4 text-goat-lime" /> : null}
            </button>
          );
        })}

        <button
          type="button"
          role="radio"
          aria-checked={isNew}
          disabled={disabled}
          onClick={selectNew}
          className={cn(
            "flex items-center gap-3 rounded-xl border border-dashed p-3 text-left transition-colors disabled:opacity-60",
            isNew ? "border-goat-lime bg-goat-lime/10" : "border-border hover:border-goat-lime/40"
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserRoundPlus className="size-3.5" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold">Soy nuevo</span>
            <span className="text-xs text-muted-foreground">No estoy en la lista</span>
          </span>
        </button>
      </div>

      {newChoice ? (
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <NewPlayerFields
            value={newChoice}
            onChange={(fields) => onChange({ kind: "new", ...fields })}
            disabled={disabled}
          />
        </div>
      ) : null}
    </div>
  );
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
