import { DEFAULT_SETTINGS } from "@/lib/data/store";
import {
  claimPlayerAction,
  createMatchAction,
  createSessionAction,
  deleteMatchAction,
  saveSettingsAction,
  signUpAction,
  updateMatchAction,
  type ActionResult,
} from "@/lib/services/fc-actions";
import { getBrowserClient } from "@/lib/supabase/client";
import {
  MATCH_COLUMNS,
  PLAYER_COLUMNS,
  SEASON_COLUMNS,
  SESSION_COLUMNS,
  SETTINGS_COLUMNS,
  toMatch,
  toPlayer,
  toSeason,
  toSession,
  toSettings,
  type MatchRow,
  type PlayerRow,
  type SeasonRow,
  type SessionRow,
  type SettingsRow,
} from "@/lib/supabase/rows";
import {
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
 * Límite de persistencia de la app. La UI solo llama a las funciones
 * exportadas aquí, nunca a Supabase directamente.
 *
 * Lecturas: `loadState()` trae todo de Supabase (clave publicable, RLS de
 * solo lectura) a una instantánea en memoria, y los getters la leen de forma
 * síncrona. `useFcStore` se encarga de cargarla y de re-renderizar.
 *
 * Escrituras: son async, pasan por Server Actions (`fc-actions.ts`) con la
 * sesión del usuario y al terminar recargan la instantánea. RLS decide qué
 * se permite; `canEditMatch` solo sirve para mostrar u ocultar botones.
 *
 * Sesión: el login corre en el navegador (cookies de `@supabase/ssr`) y el
 * proxy la refresca en cada petición.
 */

export const FC_STORE_EVENT = "fc-goat:update";

/** Cuenta con sesión iniciada. `playerId` es null hasta que reclama jugador. */
export interface Account {
  userId: string;
  email: string;
  playerId: string | null;
}

interface PersistedState {
  account: Account | null;
  players: Player[];
  matches: Match[];
  sessions: Session[];
  seasons: Season[];
  settings: AppSettings;
}

const EMPTY_STATE: PersistedState = {
  account: null,
  players: [],
  matches: [],
  sessions: [],
  seasons: [],
  settings: DEFAULT_SETTINGS,
};

let state: PersistedState | null = null;
let inflight: Promise<void> | null = null;
let listeningToAuth = false;

function readState(): PersistedState {
  return state ?? EMPTY_STATE;
}

/** true cuando ya hay una instantánea cargada desde Supabase. */
export function isLoaded(): boolean {
  return state !== null;
}

async function fetchAccount(): Promise<Account | null> {
  const supabase = getBrowserClient();
  // En el navegador basta con la sesión local: solo decide qué se muestra.
  // Quien autoriza de verdad es RLS en cada escritura.
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;

  const { data: player, error } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();
  if (error) throw new Error(`No se pudo cargar tu jugador: ${error.message}`);

  return { userId: user.id, email: user.email ?? "", playerId: player?.id ?? null };
}

function listenToAuth() {
  if (listeningToAuth || typeof window === "undefined") return;
  listeningToAuth = true;
  getBrowserClient().auth.onAuthStateChange((event) => {
    // Diferido: no se debe llamar a Supabase dentro del callback.
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      setTimeout(() => void loadState().catch(() => {}), 0);
    }
  });
}

async function fetchState(): Promise<PersistedState> {
  listenToAuth();
  const supabase = getBrowserClient();
  const [account, players, matches, sessions, seasons, settings] = await Promise.all([
    fetchAccount(),
    supabase.from("players").select(PLAYER_COLUMNS).order("created_at").returns<PlayerRow[]>(),
    supabase.from("matches").select(MATCH_COLUMNS).returns<MatchRow[]>(),
    supabase.from("sessions").select(SESSION_COLUMNS).returns<SessionRow[]>(),
    supabase.from("seasons").select(SEASON_COLUMNS).order("year").returns<SeasonRow[]>(),
    supabase.from("app_settings").select(SETTINGS_COLUMNS).maybeSingle<SettingsRow>(),
  ]);

  const failed = [players, matches, sessions, seasons, settings].find((r) => r.error);
  if (failed?.error) throw new Error(`No se pudieron cargar los datos: ${failed.error.message}`);

  const matchList = (matches.data ?? []).map(toMatch);
  const matchIdsBySession = new Map<string, string[]>();
  for (const match of [...matchList].sort(byCreatedAtAsc)) {
    if (!match.sessionId) continue;
    const ids = matchIdsBySession.get(match.sessionId) ?? [];
    ids.push(match.id);
    matchIdsBySession.set(match.sessionId, ids);
  }

  return {
    account,
    players: (players.data ?? []).map(toPlayer),
    matches: matchList,
    sessions: (sessions.data ?? []).map((row) => toSession(row, matchIdsBySession.get(row.id) ?? [])),
    seasons: (seasons.data ?? []).map(toSeason),
    settings: settings.data ? toSettings(settings.data) : DEFAULT_SETTINGS,
  };
}

function byCreatedAtAsc(a: Match, b: Match): number {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

/**
 * Recarga la instantánea desde Supabase y avisa a los suscriptores.
 * Llamadas concurrentes comparten la misma petición.
 */
export function loadState(): Promise<void> {
  if (inflight) return inflight;
  inflight = fetchState()
    .then((next) => {
      state = next;
      if (typeof window !== "undefined") window.dispatchEvent(new Event(FC_STORE_EVENT));
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

async function run<T>(action: Promise<ActionResult<T>>): Promise<T> {
  const result = await action;
  if (!result.ok) throw new Error(result.error);
  await loadState();
  return result.data;
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
  return [...readState().matches].sort((a, b) => byCreatedAtAsc(b, a));
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
}

export async function createMatch(input: CreateMatchInput): Promise<Match> {
  if (input.player1Id === input.player2Id) {
    throw new Error("Un partido necesita dos jugadores distintos.");
  }
  if (input.score1 < 0 || input.score2 < 0) {
    throw new Error("El marcador no puede ser negativo.");
  }
  if (!isMatchMode(input.mode)) {
    throw new Error("Selecciona un tipo de partido válido.");
  }
  return run(createMatchAction(input));
}

export async function updateMatch(id: string, patch: Partial<CreateMatchInput>): Promise<Match> {
  const existing = getMatch(id);
  if (existing) {
    const player1Id = patch.player1Id ?? existing.player1Id;
    const player2Id = patch.player2Id ?? existing.player2Id;
    if (player1Id === player2Id) {
      throw new Error("Un partido necesita dos jugadores distintos.");
    }
  }
  if (patch.mode !== undefined && !isMatchMode(patch.mode)) {
    throw new Error("Selecciona un tipo de partido válido.");
  }
  return run(updateMatchAction(id, patch));
}

export async function deleteMatch(id: string): Promise<void> {
  await run(deleteMatchAction(id));
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
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  return run(createSessionAction(input));
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

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = getSettings();
  return run(
    saveSettingsAction({
      ...current,
      ...patch,
      rules: { ...current.rules, ...patch.rules },
    })
  );
}

export async function resetSettings(): Promise<AppSettings> {
  return run(saveSettingsAction(DEFAULT_SETTINGS));
}

// ---------------------------------------------------------------------------
// Cuenta
// ---------------------------------------------------------------------------

export function getAccount(): Account | null {
  return readState().account;
}

export function getCurrentPlayerId(): string | null {
  return getAccount()?.playerId ?? null;
}

/** Jugadores que todavía se pueden reclamar. */
export function getUnclaimedPlayers(): Player[] {
  return getActivePlayers().filter((p) => !p.claimed);
}

/** Mismo criterio que la política RLS: autor o uno de los dos jugadores. */
export function canEditMatch(match: Match): boolean {
  const playerId = getCurrentPlayerId();
  return playerId !== null && [match.createdBy, match.player1Id, match.player2Id].includes(playerId);
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await getBrowserClient().auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(
      error.code === "invalid_credentials" ? "Email o contraseña incorrectos." : error.message
    );
  }
  await loadState();
}

export async function signUp(email: string, password: string): Promise<void> {
  const result = await signUpAction(email, password);
  if (!result.ok) throw new Error(result.error);
  await signIn(email, password);
}

export async function signOut(): Promise<void> {
  await getBrowserClient().auth.signOut();
  await loadState();
}

export async function claimPlayer(playerId: string): Promise<Player> {
  return run(claimPlayerAction(playerId));
}

// ---------------------------------------------------------------------------
// Datos derivados
// ---------------------------------------------------------------------------

/** Ranking GOAT general, o solo con los partidos de un tipo si se pasa `mode`. */
export function getRanking(mode?: MatchMode): RankingEntry[] {
  const { players, matches: all, settings } = readState();
  const matches = mode ? all.filter((m) => m.mode === mode) : all;
  return computeRanking(players, matches, settings.rules);
}

export function getHeadToHead(playerAId: string, playerBId: string): HeadToHead {
  const { matches, settings } = readState();
  return computeHeadToHead(playerAId, playerBId, matches, settings.rules);
}
