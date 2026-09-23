"use client";

import Link from "next/link";
import { Flame, Trophy } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PlayerAvatar } from "@/components/player-avatar";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useFcStore } from "@/hooks/use-fc-store";
import { getRanking } from "@/lib/services/fc-service";
import { formatWinRate } from "@/types";
import { cn } from "@/lib/utils";

export default function RankingPage() {
  const { data: ranking, ready } = useFcStore(getRanking);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ranking GOAT"
        description="Calculado en vivo a partir del historial de partidos: puntos, win rate y desempate por diferencia de goles."
      />

      {!ready ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : ranking && ranking.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Jugador</TableHead>
                <TableHead className="text-right">Pts</TableHead>
                <TableHead className="text-right">PJ</TableHead>
                <TableHead className="text-right">G</TableHead>
                <TableHead className="text-right">E</TableHead>
                <TableHead className="text-right">P</TableHead>
                <TableHead className="text-right">DG</TableHead>
                <TableHead className="text-right">K.O.</TableHead>
                <TableHead className="text-right">Win rate</TableHead>
                <TableHead className="text-right">Racha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((entry) => (
                <TableRow key={entry.player.id} className="group">
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {entry.rank === 1 ? (
                      <Trophy className="size-4 text-goat-lime" />
                    ) : (
                      entry.rank
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/players/${entry.player.id}`}
                      className="flex items-center gap-2.5 font-medium group-hover:text-goat-lime"
                    >
                      <PlayerAvatar player={entry.player} size="sm" />
                      {entry.player.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-goat-lime">
                    {entry.points}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {entry.played}
                  </TableCell>
                  <TableCell className="text-right font-mono">{entry.wins}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {entry.draws}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {entry.losses}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      entry.goalDifference > 0 && "text-goat-lime",
                      entry.goalDifference < 0 && "text-goat-coral"
                    )}
                  >
                    {entry.goalDifference > 0 ? "+" : ""}
                    {entry.goalDifference}
                  </TableCell>
                  <TableCell className="text-right font-mono text-goat-coral">
                    {entry.koWins > 0 ? entry.koWins : "–"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatWinRate(entry.winRate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.currentStreak !== 0 ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 font-mono text-xs font-bold",
                          entry.currentStreak > 0 ? "text-goat-lime" : "text-goat-coral"
                        )}
                      >
                        <Flame className="size-3" />
                        {entry.currentStreak > 0 ? "+" : ""}
                        {entry.currentStreak}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">–</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="Todavía no hay ranking"
          description="Registra el primer partido para que el ranking se calcule automáticamente."
          actionLabel="Registrar partido"
          actionHref="/matches/new"
        />
      )}
    </div>
  );
}
