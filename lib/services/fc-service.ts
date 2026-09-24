import {
  DEFAULT_SETTINGS,
  SEED_MATCHES,
  SEED_PLAYERS,
  SEED_SEASONS,
  SEED_SESSIONS,
} from "@/lib/data/store";
import {
  DEFAULT_MATCH_MODE,
  getHeadToHead as computeHeadToHead,
  isMatchMode,
  getRanking as computeRanking,
  type AppSettings,
  type GoatRules,
  type HeadToHead,
  type Match,
  type MatchMode,
  type Player,
  type RankingEntry,
  type Season,
  type Session,
} from "@/types";

/**
 * Límite de persistencia de la app. Hoy usa `localStorage`; la UI solo debe
 * llamar a las funciones exportadas aquí, nunca leer `localStorage`
 * directamente, para poder sustituir esta capa por Supabase sin tocar rutas
 * ni componentes.
 */

const STORAGE_KEY = "fc-goat-state";
export const FC_STORE_EVENT = "fc-goat:update";

interface PersistedState {
  players: Player[];
  matches: Match[];
  sessions: Session[];
  seasons: Season[];
  settings: AppSettings;
}

function seedState(): PersistedState {
  return {
    players: SEED_PLAYERS,
    matches: SEED_MATCHES,
    sessions: SEED_SESSIONS,
    seasons: SEED_SEASONS,
    settings: DEFAULT_SETTINGS,
  };
}

function readState(): PersistedState {
  if (typeof window === "undefined") return seedState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      players: parsed.players ?? SEED_PLAYERS,
      matches: (parsed.matches ?? SEED_MATCHES).map(normalizeMatch),
      sessions: parsed.sessions ?? SEED_SESSIONS,
      seasons: parsed.seasons ?? SEED_SEASONS,
      settings: parsed.settings ?? DEFAULT_SETTINGS,
    };
  } catch {
    return seedState();
  }
}

/** Partidos guardados antes de existir `mode` se consideran de plantilla normal. */
function normalizeMatch(match: Match): Match {
  return isMatchMode(match.mode) ? match : { ...match, mode: DEFAULT_MATCH_MODE };
}

function writeState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(FC_STORE_EVENT));
}

function generateId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${uuid}`;
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export function getPlayers(): Player[] {
  return readState().players;
}

export function getActivePlayers(): Player[] {
  return getPlayers().filter((p) => p.active);
}

export function getPlayer(id: string): Player | undefined {
  return getPlayers().find((p) => p.id === id);
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

export function getMatches(): Match[] {
  return [...readState().matches].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getMatch(id: string): Match | undefined {
  return readState().matches.find((m) => m.id === id);
}

export function getMatchesForPlayer(playerId: string): Match[] {
  return getMatches().filter((m) => m.player1Id === playerId || m.player2Id === playerId);
}

export function getMatchesForSession(sessionId: string): Match[] {
  return getMatches().filter((m) => m.sessionId === sessionId);
}

export interface CreateMatchInput {
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
}

export function createMatch(input: CreateMatchInput): Match {
  if (input.player1Id === input.player2Id) {
    throw new Error("Un partido necesita dos jugadores distintos.");
  }
  if (input.score1 < 0 || input.score2 < 0) {
    throw new Error("El marcador no puede ser negativo.");
  }
  if (!isMatchMode(input.mode)) {
    throw new Error("Selecciona un tipo de partido válido.");
  }

  const state = readState();
  const match: Match = {
    id: generateId("m"),
    player1Id: input.player1Id,
    player2Id: input.player2Id,
    score1: input.score1,
    score2: input.score2,
    mode: input.mode,
    season: input.season,
    sessionId: input.sessionId,
    notes: input.notes,
    evidenceUrl: input.evidenceUrl,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };

  state.matches = [...state.matches, match];
  if (match.sessionId) {
    state.sessions = state.sessions.map((session) =>
      session.id === match.sessionId
        ? { ...session, matchIds: [...session.matchIds, match.id] }
        : session
    );
  }
  writeState(state);
  return match;
}

export function updateMatch(id: string, patch: Partial<CreateMatchInput>): Match {
  const state = readState();
  const existing = state.matches.find((m) => m.id === id);
  if (!existing) throw new Error(`No existe el partido ${id}.`);

  const updated: Match = { ...existing, ...patch };
  if (updated.player1Id === updated.player2Id) {
    throw new Error("Un partido necesita dos jugadores distintos.");
  }
  if (!isMatchMode(updated.mode)) {
    throw new Error("Selecciona un tipo de partido válido.");
  }

  state.matches = state.matches.map((m) => (m.id === id ? updated : m));
  writeState(state);
  return updated;
}

export function deleteMatch(id: string): void {
  const state = readState();
  state.matches = state.matches.filter((m) => m.id !== id);
  state.sessions = state.sessions.map((session) => ({
    ...session,
    matchIds: session.matchIds.filter((matchId) => matchId !== id),
  }));
  writeState(state);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function getSessions(): Session[] {
  return [...readState().sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getSession(id: string): Session | undefined {
  return readState().sessions.find((s) => s.id === id);
}

export interface CreateSessionInput {
  name: string;
  date: string;
  season: number;
  createdBy: string;
}

export function createSession(input: CreateSessionInput): Session {
  const state = readState();
  const session: Session = {
    id: generateId("session"),
    name: input.name,
    date: input.date,
    season: input.season,
    matchIds: [],
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  state.sessions = [...state.sessions, session];
  writeState(state);
  return session;
}

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------

export function getSeasons(): Season[] {
  return readState().seasons;
}

export function getActiveSeason(): Season | undefined {
  return getSeasons().find((s) => s.active);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function getSettings(): AppSettings {
  return readState().settings;
}

export function getRules(): GoatRules {
  return getSettings().rules;
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const state = readState();
  state.settings = {
    ...state.settings,
    ...patch,
    rules: { ...state.settings.rules, ...patch.rules },
  };
  writeState(state);
  return state.settings;
}

export function resetSettings(): AppSettings {
  const state = readState();
  state.settings = DEFAULT_SETTINGS;
  writeState(state);
  return state.settings;
}

// ---------------------------------------------------------------------------
// Datos derivados
// ---------------------------------------------------------------------------

/** Ranking GOAT general, o solo con los partidos de un tipo si se pasa `mode`. */
export function getRanking(mode?: MatchMode): RankingEntry[] {
  const state = readState();
  const matches = mode ? state.matches.filter((m) => m.mode === mode) : state.matches;
  return computeRanking(state.players, matches, state.settings.rules);
}

export function getHeadToHead(playerAId: string, playerBId: string): HeadToHead {
  const state = readState();
  return computeHeadToHead(playerAId, playerBId, state.matches, state.settings.rules);
}

export function resetAllData(): void {
  writeState(seedState());
}
