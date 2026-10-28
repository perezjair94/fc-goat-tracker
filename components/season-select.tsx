"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFcStore } from "@/hooks/use-fc-store";
import { getCurrentSeason, getSeasons, type SeasonFilter } from "@/lib/services/fc-service";
import { formatDay } from "@/lib/format";
import { toSeasonDay, type Season } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Temporada elegida en una página. Mientras no se elija ninguna sigue a la
 * temporada actual (o al histórico si `defaultTo` es "all"), así que no hace
 * falta esperar a que carguen las temporadas para inicializarla.
 */
export function useSeasonFilter(defaultTo: "current" | "all" = "current") {
  const [choice, setChoice] = useState<SeasonFilter | null>(null);
  const { data: current } = useFcStore(getCurrentSeason);
  const season: SeasonFilter = choice ?? (defaultTo === "all" ? "all" : (current?.number ?? "all"));
  return [season, setChoice] as const;
}

/** "24 sept 2026 – 25 oct 2026", o "desde 26 oct 2026" si sigue abierta. */
export function formatSeasonRange(season: Season): string {
  return season.endsOn
    ? `${formatDay(season.startsOn)} – ${formatDay(season.endsOn)}`
    : `desde ${formatDay(season.startsOn)}`;
}

/** true si la temporada ya terminó (hoy en Bogotá). */
export function isSeasonOver(season: Season): boolean {
  return season.endsOn !== undefined && season.endsOn < toSeasonDay();
}

export function SeasonSelect({
  value,
  onChange,
  className,
}: {
  value: SeasonFilter;
  onChange: (value: SeasonFilter) => void;
  className?: string;
}) {
  const { data: seasons } = useFcStore(getSeasons);
  const { data: current } = useFcStore(getCurrentSeason);
  const today = toSeasonDay();
  // Las programadas aún no tienen partidos; la más reciente va primero.
  const started = (seasons ?? []).filter((s) => s.startsOn <= today).reverse();

  const labelFor = (raw: string) => {
    if (raw === "all") return "Histórico";
    const season = started.find((s) => String(s.number) === raw);
    if (!season) return "Temporada";
    return season.number === current?.number ? `${season.name} · actual` : season.name;
  };

  return (
    <Select
      value={String(value)}
      onValueChange={(raw) => {
        if (!raw) return;
        onChange(raw === "all" ? "all" : Number(raw));
      }}
    >
      <SelectTrigger className={cn("w-48", className)} aria-label="Temporada">
        <SelectValue placeholder="Temporada">{(raw: string) => labelFor(raw)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {started.map((season) => (
          <SelectItem key={season.id} value={String(season.number)}>
            <span className="flex flex-col">
              <span>{labelFor(String(season.number))}</span>
              <span className="text-xs text-muted-foreground">{formatSeasonRange(season)}</span>
            </span>
          </SelectItem>
        ))}
        <SelectItem value="all">Histórico</SelectItem>
      </SelectContent>
    </Select>
  );
}
