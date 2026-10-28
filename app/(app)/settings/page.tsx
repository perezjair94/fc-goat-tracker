"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, RotateCcw, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RequirePlayer } from "@/components/require-player";
import { formatSeasonRange, isSeasonOver } from "@/components/season-select";
import { useFcStore } from "@/hooks/use-fc-store";
import {
  createSeason,
  deleteSeason,
  getCurrentSeason,
  getSeasons,
  getSettings,
  resetSettings,
  updateSettings,
} from "@/lib/services/fc-service";
import { formatDay } from "@/lib/format";
import { toSeasonDay, type AppSettings, type GoatRules, type Season } from "@/types";

export default function SettingsPage() {
  const { data: settings, ready } = useFcStore(getSettings);
  const { data: seasons } = useFcStore(getSeasons);
  const { data: current } = useFcStore(getCurrentSeason);

  if (!ready || !settings) return null;

  return (
    <RequirePlayer action="cambiar la configuración">
      <div className="flex flex-col gap-6">
        <SettingsForm initialSettings={settings} />
        <SeasonsCard seasons={seasons ?? []} current={current} />
      </div>
    </RequirePlayer>
  );
}

function SettingsForm({ initialSettings }: { initialSettings: AppSettings }) {
  const [appName, setAppName] = useState(initialSettings.appName);
  const [groupName, setGroupName] = useState(initialSettings.groupName);
  const [rules, setRules] = useState<GoatRules>(initialSettings.rules);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateSettings({ appName, groupName, rules });
      toast.success("Configuración guardada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la configuración.");
    }
  }

  async function handleReset() {
    try {
      const restored = await resetSettings();
      setAppName(restored.appName);
      setGroupName(restored.groupName);
      setRules(restored.rules);
      toast.success("Configuración restaurada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo restaurar la configuración.");
    }
  }

  function updateRule(key: keyof GoatRules, value: string) {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setRules((prev) => ({ ...prev, [key]: num }));
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <PageHeader
        title="Configuración"
        description="Nombre de la app, grupo, reglas GOAT y temporadas."
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={handleReset}>
              <RotateCcw className="size-3.5" />
              Restaurar
            </Button>
            <Button type="submit" size="sm" className="gap-1.5 bg-goat-lime text-black hover:bg-goat-lime-2">
              <Save className="size-3.5" />
              Guardar
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="app-name">Nombre de la app</Label>
              <Input id="app-name" value={appName} onChange={(e) => setAppName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="group-name">Grupo</Label>
              <Input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reglas GOAT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <RuleField label="Puntos por victoria" value={rules.winPoints} onChange={(v) => updateRule("winPoints", v)} />
            <RuleField label="Puntos por empate" value={rules.drawPoints} onChange={(v) => updateRule("drawPoints", v)} />
            <RuleField label="Puntos por derrota" value={rules.lossPoints} onChange={(v) => updateRule("lossPoints", v)} />
            <RuleField
              label="Diferencia de goles para K.O."
              value={rules.koGoalDifference}
              onChange={(v) => updateRule("koGoalDifference", v)}
            />
            <RuleField label="Bonus de puntos por K.O." value={rules.koBonusPoints} onChange={(v) => updateRule("koBonusPoints", v)} />
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            El K.O. nunca se introduce manualmente: siempre se calcula a partir del marcador. Cambiar estas
            reglas recalcula el ranking y las estadísticas de inmediato.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}

function RuleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input type="number" min={0} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Día siguiente a `day` (YYYY-MM-DD). */
function nextDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/**
 * Lista de temporadas y alta de la siguiente. Una temporada termina el día
 * antes de que empiece la siguiente, así que programarla es cerrar la actual.
 */
function SeasonsCard({ seasons, current }: { seasons: Season[]; current: Season | undefined }) {
  const today = toSeasonDay();
  const last = seasons.at(-1);
  const minStart = nextDay(last && last.startsOn >= today ? last.startsOn : today);
  const nextName = `Temporada ${(last?.number ?? 0) + 1}`;

  const [name, setName] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!startsOn || saving) return;
    setSaving(true);
    try {
      const season = await createSeason({ name: name.trim() || nextName, startsOn });
      toast.success(`${season.name} programada para el ${formatDay(season.startsOn)}`);
      setName("");
      setStartsOn("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo programar la temporada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(season: Season) {
    try {
      await deleteSeason(season.id);
      toast.success(`${season.name} cancelada`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cancelar la temporada.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temporadas</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2">
          {[...seasons].reverse().map((season) => {
            const scheduled = season.startsOn > today;
            return (
              <li
                key={season.id}
                className="flex items-center gap-3 rounded-xl border border-border px-3 py-2"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{season.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSeasonRange(season)}</p>
                </div>
                {season.id === current?.id ? (
                  <Badge className="bg-goat-lime text-black">Actual</Badge>
                ) : scheduled ? (
                  <Badge variant="outline">Programada</Badge>
                ) : isSeasonOver(season) ? (
                  <Badge variant="secondary">Terminada</Badge>
                ) : null}
                {scheduled && season.id === last?.id ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Cancelar ${season.name}`}
                    onClick={() => handleDelete(season)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>

        <Separator />

        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <p className="text-sm font-medium">Programar la siguiente temporada</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="season-name">Nombre</Label>
              <Input id="season-name" value={name} placeholder={nextName} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="season-start">Empieza el</Label>
              <Input
                id="season-start"
                type="date"
                min={minStart}
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={saving || !startsOn} className="gap-1.5">
              <CalendarPlus className="size-3.5" />
              {saving ? "Guardando..." : "Programar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {last ? `${last.name} termina el día anterior. ` : ""}Los partidos se asignan solos a su
            temporada según la fecha (hora de Bogotá); cada temporada arranca el ranking de cero.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
