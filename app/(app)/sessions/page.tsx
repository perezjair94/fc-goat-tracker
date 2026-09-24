"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Layers3, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFcStore } from "@/hooks/use-fc-store";
import { createSession, getActiveSeason, getSessions } from "@/lib/services/fc-service";
import { useCurrentPlayer } from "@/hooks/use-current-player";
import { formatDate } from "@/lib/format";

export default function SessionsPage() {
  const { data: sessions, ready } = useFcStore(getSessions);
  const router = useRouter();
  const { account, currentPlayerId } = useCurrentPlayer();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || creating) return;
    if (!currentPlayerId) {
      toast.error(account ? "Elige tu jugador antes de crear una sesión." : "Inicia sesión para crear una sesión.");
      router.push(account ? "/claim" : "/login");
      return;
    }
    setCreating(true);
    try {
      const season = getActiveSeason()?.year ?? new Date().getFullYear();
      await createSession({ name: name.trim(), date, season });
      toast.success("Sesión creada");
      setName("");
      setDate(today);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la sesión.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sesiones"
        description="Agrupa partidos jugados el mismo día o encuentro."
        actions={
          <Button size="sm" className="gap-1.5 bg-goat-lime text-black hover:bg-goat-lime-2" onClick={() => {
            if (currentPlayerId) setOpen(true);
            else router.push(account ? "/claim" : "/login");
          }}>
            <Plus className="size-4" />
            Nueva sesión
          </Button>
        }
      />

      {!ready ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : sessions && sessions.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-goat-lime/40"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers3 className="size-4" />
                <span className="text-xs">{formatDate(session.date)}</span>
              </div>
              <p className="font-semibold">{session.name}</p>
              <p className="text-xs text-muted-foreground">
                {session.matchIds.length} {session.matchIds.length === 1 ? "partido" : "partidos"}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No hay sesiones"
          description="Crea una sesión para agrupar los partidos de una noche de juego."
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva sesión</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="session-name">Nombre</Label>
              <Input
                id="session-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Noche de viernes"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="session-date">Fecha</Label>
              <Input id="session-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={creating} className="bg-goat-lime text-black hover:bg-goat-lime-2">
                {creating ? "Creando..." : "Crear sesión"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
