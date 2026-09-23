import Link from "next/link";
import { Flame, Trophy } from "lucide-react";
import { PlayerAvatar } from "@/components/player-avatar";
import { formatWinRate, type RankingEntry } from "@/types";

export function GoatHero({ entry }: { entry: RankingEntry }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-goat-lime/20 bg-goat-surface-hero p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "var(--goat-lime)" }}
      />
      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <PlayerAvatar player={entry.player} size="xl" className="ring-2 ring-goat-lime/50" />
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-goat-lime">
              <Trophy className="size-4" />
              <span className="text-xs font-bold uppercase tracking-widest">GOAT actual</span>
            </div>
            <Link href={`/players/${entry.player.id}`} className="text-2xl font-black tracking-tight hover:underline sm:text-3xl">
              {entry.player.name}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {entry.points} pts · {formatWinRate(entry.winRate)} win rate · {entry.played} partidos
            </p>
          </div>
        </div>

        {entry.currentStreak !== 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-black/20 px-4 py-2">
            <Flame className={entry.currentStreak > 0 ? "size-4 text-goat-lime" : "size-4 text-goat-coral"} />
            <span className="text-sm font-bold">
              Racha {entry.currentStreak > 0 ? `+${entry.currentStreak}` : entry.currentStreak}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
