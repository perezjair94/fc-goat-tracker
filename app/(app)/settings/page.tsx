"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFcStore } from "@/hooks/use-fc-store";
import { getSeasons, getSettings, resetSettings, updateSettings } from "@/lib/services/fc-service";
import type { AppSettings, GoatRules, Season } from "@/types";

export default function SettingsPage() {
  const { data: settings, ready } = useFcStore(getSettings);
  const { data: seasons } = useFcStore(getSeasons);

  if (!ready || !settings) return null;

  return <SettingsForm key={settings.activeSeasonId} initialSettings={settings} seasons={seasons ?? []} />;
}

function SettingsForm({ initialSettings, seasons }: { initialSettings: AppSettings; seasons: Season[] }) {
  const [appName, setAppName] = useState(initialSettings.appName);
  const [groupName, setGroupName] = useState(initialSettings.groupName);
  const [activeSeasonId, setActiveSeasonId] = useState(initialSettings.activeSeasonId);
  const [rules, setRules] = useState<GoatRules>(initialSettings.rules);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateSettings({ appName, groupName, activeSeasonId, rules });
    toast.success("Configuración guardada");
  }

  function handleReset() {
    const restored = resetSettings();
    setAppName(restored.appName);
    setGroupName(restored.groupName);
    setActiveSeasonId(restored.activeSeasonId);
    setRules(restored.rules);
    toast.success("Configuración restaurada");
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
        description="Nombre de la app, grupo, temporada activa y reglas GOAT."
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
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Label htmlFor="season">Temporada activa</Label>
            <Select value={activeSeasonId} onValueChange={(value) => value && setActiveSeasonId(value)}>
              <SelectTrigger id="season" className="w-full">
                <SelectValue placeholder="Selecciona temporada">
                  {(value: string) => seasons.find((s) => s.id === value)?.name ?? "Selecciona temporada"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
