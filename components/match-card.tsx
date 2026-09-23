import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import { KOBadge } from "@/components/outcome-badge";
import { formatRelative } from "@/lib/format";
import type { Match, Player } from "@/types";
import { isKnockout } from "@/types";

interface MatchCardProps {
  match: Match;
  player1: Player;
  player2: Player;
  rules?: Parameters<typeof isKnockout>[1];
}

export function MatchCard({ match, player1, player2, rules }: MatchCardProps) {
  const ko = isKnockout(match, rules);
  const p1Wins = match.score1 > match.score2;
  const p2Wins = match.score2 > match.score1;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-goat-lime/40 hover:bg-card/80"
    >
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <PlayerAvatar player={player1} size="sm" />
        <span className={`truncate text-sm font-medium ${p1Wins ? "text-foreground" : "text-muted-foreground"}`}>
          {player1.name}
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1 font-mono text-sm font-bold tabular-nums">
        <span className={p1Wins ? "text-goat-lime" : ""}>{match.score1}</span>
        <span className="text-muted-foreground">–</span>
        <span className={p2Wins ? "text-goat-lime" : ""}>{match.score2}</span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3 min-w-0">
        <span className={`truncate text-right text-sm font-medium ${p2Wins ? "text-foreground" : "text-muted-foreground"}`}>
          {player2.name}
        </span>
        <PlayerAvatar player={player2} size="sm" />
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        {ko ? <KOBadge /> : null}
        <span className="text-xs text-muted-foreground">{formatRelative(match.createdAt)}</span>
      </div>
    </Link>
  );
}
