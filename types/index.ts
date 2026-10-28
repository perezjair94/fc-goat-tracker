/**
 * Dominio de FC GOAT Tracker.
 *
 * El historial de partidos es la única fuente de verdad: ranking, victorias,
 * empates, derrotas, goles, K.O. y puntos GOAT se derivan siempre de `Match[]`.
 * Nunca se deben persistir contadores independientes.
 */

export interface Player {
  id: string;
  name: string;
  handle: string;
  color: string;
  initials: string;
  active: boolean;
  createdAt: string;
}

/** Tipo de partido según cómo se armaron los equipos. */
export type MatchMode = "global95" | "ultimate" | "squad";

export const MATCH_MODES: MatchMode[] = ["global95", "ultimate", "squad"];

export const DEFAULT_MATCH_MODE: MatchMode = "squad";

export const MATCH_MODE_LABELS: Record<MatchMode, string> = {
  global95: "95 de media global",
  ultimate: "Ultimate Team",
  squad: "Plantilla normal",
};

export const MATCH_MODE_SHORT_LABELS: Record<MatchMode, string> = {
  global95: "95 GLOBAL",
  ultimate: "UT",
  squad: "PLANTILLA",
};

export function isMatchMode(value: unknown): value is MatchMode {
  return typeof value === "string" && (MATCH_MODES as string[]).includes(value);
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  score1: number;
  score2: number;
  mode: MatchMode;
  season: number;
  sessionId?: string;
  notes?: string;
  evidenceUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  date: string;
  season: number;
  matchIds: string[];
  createdBy: string;
  createdAt: string;
}

/**
 * Una temporada empieza en `startsOn` y termina el día antes de que empiece
 * la siguiente (`endsOn`, vacío si es la última). Las fechas son días
 * `YYYY-MM-DD` en hora de Bogotá. `Match.season` y `Session.season` guardan
 * su `number`.
 */
export interface Season {
  id: string;
  number: number;
  name: string;
  startsOn: string;
  endsOn?: string;
}

export const SEASON_TIME_ZONE = "America/Bogota";

/** Día `YYYY-MM-DD` de un instante en hora de Bogotá. */
export function toSeasonDay(date: Date = new Date()): string {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: SEASON_TIME_ZONE }).format(date);
}

/**
 * Temporada a la que pertenece un día (`seasons` ordenadas por inicio).
 * Antes de la primera cuenta como la primera, igual que `season_for` en SQL.
 */
export function getSeasonForDay(seasons: Season[], day: string): Season | undefined {
  const started = seasons.filter((s) => s.startsOn <= day);
  return started.length > 0 ? started[started.length - 1] : seasons[0];
}

export interface GoatRules {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  koGoalDifference: number;
  koBonusPoints: number;
}

export interface AppSettings {
  appName: string;
  groupName: string;
  rules: GoatRules;
}

export const DEFAULT_RULES: GoatRules = {
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  koGoalDifference: 5,
  koBonusPoints: 2,
};

export type MatchOutcome = "win" | "draw" | "loss";

export interface PlayerMatchResult {
  playerId: string;
  opponentId: string;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  outcome: MatchOutcome;
  isKO: boolean;
  points: number;
}

/** Determina el resultado de un partido para ambos jugadores a partir del marcador. */
export function getMatchResults(
  match: Match,
  rules: GoatRules = DEFAULT_RULES
): [PlayerMatchResult, PlayerMatchResult] {
  const diff = Math.abs(match.score1 - match.score2);
  const isKO = diff >= rules.koGoalDifference && match.score1 !== match.score2;

  const outcome1: MatchOutcome =
    match.score1 > match.score2 ? "win" : match.score1 < match.score2 ? "loss" : "draw";
  const outcome2: MatchOutcome =
    outcome1 === "win" ? "loss" : outcome1 === "loss" ? "win" : "draw";

  const basePoints = (outcome: MatchOutcome) =>
    outcome === "win" ? rules.winPoints : outcome === "draw" ? rules.drawPoints : rules.lossPoints;

  const points1 = basePoints(outcome1) + (isKO && outcome1 === "win" ? rules.koBonusPoints : 0);
  const points2 = basePoints(outcome2) + (isKO && outcome2 === "win" ? rules.koBonusPoints : 0);

  const result1: PlayerMatchResult = {
    playerId: match.player1Id,
    opponentId: match.player2Id,
    goalsFor: match.score1,
    goalsAgainst: match.score2,
    goalDifference: match.score1 - match.score2,
    outcome: outcome1,
    isKO,
    points: points1,
  };

  const result2: PlayerMatchResult = {
    playerId: match.player2Id,
    opponentId: match.player1Id,
    goalsFor: match.score2,
    goalsAgainst: match.score1,
    goalDifference: match.score2 - match.score1,
    outcome: outcome2,
    isKO,
    points: points2,
  };

  return [result1, result2];
}

/** true si el marcador del partido constituye K.O. según las reglas. */
export function isKnockout(match: Match, rules: GoatRules = DEFAULT_RULES): boolean {
  return (
    match.score1 !== match.score2 &&
    Math.abs(match.score1 - match.score2) >= rules.koGoalDifference
  );
}

/** Devuelve el id del jugador ganador, o null si hay empate. */
export function getWinnerId(match: Match): string | null {
  if (match.score1 === match.score2) return null;
  return match.score1 > match.score2 ? match.player1Id : match.player2Id;
}

export interface RankingEntry {
  rank: number;
  player: Player;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  koWins: number;
  koLosses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
}

function sortMatchesChronologically(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Calcula el ranking GOAT derivado exclusivamente del historial de partidos.
 * Las rachas se recorren en orden cronológico real (no como conteo total de victorias).
 */
export function getRanking(
  players: Player[],
  matches: Match[],
  rules: GoatRules = DEFAULT_RULES
): RankingEntry[] {
  const chronological = sortMatchesChronologically(matches);

  const stats = new Map<
    string,
    {
      points: number;
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      koWins: number;
      koLosses: number;
      currentStreak: number;
      bestStreak: number;
      streakSign: 0 | 1 | -1;
    }
  >();

  const initStats = () => ({
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    koWins: 0,
    koLosses: 0,
    currentStreak: 0,
    bestStreak: 0,
    streakSign: 0 as 0 | 1 | -1,
  });

  for (const player of players) {
    stats.set(player.id, initStats());
  }

  for (const match of chronological) {
    const [result1, result2] = getMatchResults(match, rules);
    for (const result of [result1, result2]) {
      if (!stats.has(result.playerId)) stats.set(result.playerId, initStats());
      const s = stats.get(result.playerId)!;
      s.points += result.points;
      s.played += 1;
      s.goalsFor += result.goalsFor;
      s.goalsAgainst += result.goalsAgainst;
      if (result.outcome === "win") s.wins += 1;
      if (result.outcome === "draw") s.draws += 1;
      if (result.outcome === "loss") s.losses += 1;
      if (result.isKO && result.outcome === "win") s.koWins += 1;
      if (result.isKO && result.outcome === "loss") s.koLosses += 1;

      const sign: 0 | 1 | -1 =
        result.outcome === "win" ? 1 : result.outcome === "loss" ? -1 : 0;
      if (sign !== 0 && sign === s.streakSign) {
        s.currentStreak += 1;
      } else {
        s.currentStreak = sign === 0 ? 0 : 1;
        s.streakSign = sign;
      }
      if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
    }
  }

  const entries: RankingEntry[] = players.map((player) => {
    const s = stats.get(player.id) ?? initStats();
    return {
      rank: 0,
      player,
      points: s.points,
      played: s.played,
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDifference: s.goalsFor - s.goalsAgainst,
      koWins: s.koWins,
      koLosses: s.koLosses,
      winRate: s.played > 0 ? s.wins / s.played : 0,
      currentStreak: s.streakSign === -1 ? -s.currentStreak : s.currentStreak,
      bestStreak: s.bestStreak,
    };
  });

  entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return b.goalDifference - a.goalDifference;
  });

  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}

export interface HeadToHead {
  playerAId: string;
  playerBId: string;
  matches: Match[];
  winsA: number;
  winsB: number;
  draws: number;
  goalsForA: number;
  goalsForB: number;
  koWinsA: number;
  koWinsB: number;
}

/** Compara el historial directo entre dos jugadores. */
export function getHeadToHead(
  playerAId: string,
  playerBId: string,
  matches: Match[],
  rules: GoatRules = DEFAULT_RULES
): HeadToHead {
  const direct = sortMatchesChronologically(
    matches.filter(
      (m) =>
        (m.player1Id === playerAId && m.player2Id === playerBId) ||
        (m.player1Id === playerBId && m.player2Id === playerAId)
    )
  );

  const h2h: HeadToHead = {
    playerAId,
    playerBId,
    matches: direct,
    winsA: 0,
    winsB: 0,
    draws: 0,
    goalsForA: 0,
    goalsForB: 0,
    koWinsA: 0,
    koWinsB: 0,
  };

  for (const match of direct) {
    const [result1, result2] = getMatchResults(match, rules);
    const resultA = match.player1Id === playerAId ? result1 : result2;
    const resultB = match.player1Id === playerAId ? result2 : result1;

    h2h.goalsForA += resultA.goalsFor;
    h2h.goalsForB += resultB.goalsFor;
    if (resultA.outcome === "win") h2h.winsA += 1;
    else if (resultB.outcome === "win") h2h.winsB += 1;
    else h2h.draws += 1;
    if (resultA.isKO && resultA.outcome === "win") h2h.koWinsA += 1;
    if (resultB.isKO && resultB.outcome === "win") h2h.koWinsB += 1;
  }

  return h2h;
}

export function formatWinRate(winRate: number): string {
  return `${Math.round(winRate * 100)}%`;
}

export function getPlayerInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
