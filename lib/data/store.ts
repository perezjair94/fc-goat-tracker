import type { AppSettings, Match, Player, Season, Session } from "@/types";
import { DEFAULT_RULES } from "@/types";

/**
 * Dataset seed único. Toda la app (dashboard, rutas workspace y servicio de
 * persistencia) consume esta misma fuente — no debe existir un segundo
 * dataset mock en paralelo.
 */

export const SEED_PLAYERS: Player[] = [
  { id: "p-ace", name: "Ace", handle: "@ace", color: "#d4ff45", initials: "AC", active: true, createdAt: "2026-01-05T10:00:00.000Z" },
  { id: "p-blaze", name: "Blaze", handle: "@blaze", color: "#ff8069", initials: "BL", active: true, createdAt: "2026-01-05T10:00:00.000Z" },
  { id: "p-cobra", name: "Cobra", handle: "@cobra", color: "#5ab0ff", initials: "CO", active: true, createdAt: "2026-01-05T10:00:00.000Z" },
  { id: "p-drako", name: "Drako", handle: "@drako", color: "#ffb84d", initials: "DR", active: true, createdAt: "2026-01-05T10:00:00.000Z" },
  { id: "p-echo", name: "Echo", handle: "@echo", color: "#c792ff", initials: "EC", active: true, createdAt: "2026-01-05T10:00:00.000Z" },
  { id: "p-fenix", name: "Fenix", handle: "@fenix", color: "#4dd4c0", initials: "FE", active: true, createdAt: "2026-01-05T10:00:00.000Z" },
  { id: "p-ghost", name: "Ghost", handle: "@ghost", color: "#ff6ea8", initials: "GH", active: true, createdAt: "2026-01-05T10:00:00.000Z" },
  { id: "p-hawk", name: "Hawk", handle: "@hawk", color: "#b8e944", initials: "HA", active: true, createdAt: "2026-01-05T10:00:00.000Z" },
];

export const SEED_SEASONS: Season[] = [
  { id: "season-2026", year: 2026, name: "Temporada 2026", active: true },
];

export const SEED_SESSIONS: Session[] = [
  {
    id: "session-1",
    name: "Noche de viernes",
    date: "2026-01-09",
    season: 2026,
    matchIds: ["m-1", "m-2", "m-3"],
    createdBy: "p-ace",
    createdAt: "2026-01-09T20:00:00.000Z",
  },
  {
    id: "session-2",
    name: "Maratón sabatino",
    date: "2026-01-17",
    season: 2026,
    matchIds: ["m-4", "m-5", "m-6", "m-7"],
    createdBy: "p-blaze",
    createdAt: "2026-01-17T16:00:00.000Z",
  },
  {
    id: "session-3",
    name: "Revancha entre semana",
    date: "2026-02-04",
    season: 2026,
    matchIds: ["m-8", "m-9", "m-10"],
    createdBy: "p-cobra",
    createdAt: "2026-02-04T19:30:00.000Z",
  },
];

export const SEED_MATCHES: Match[] = [
  { id: "m-1", player1Id: "p-ace", player2Id: "p-blaze", score1: 4, score2: 1, mode: "squad", season: 2026, sessionId: "session-1", createdBy: "p-ace", createdAt: "2026-01-09T20:15:00.000Z" },
  { id: "m-2", player1Id: "p-cobra", player2Id: "p-drako", score1: 2, score2: 2, mode: "squad", season: 2026, sessionId: "session-1", createdBy: "p-ace", createdAt: "2026-01-09T20:45:00.000Z" },
  { id: "m-3", player1Id: "p-echo", player2Id: "p-fenix", score1: 6, score2: 0, mode: "global95", season: 2026, sessionId: "session-1", createdBy: "p-ace", createdAt: "2026-01-09T21:15:00.000Z" },
  { id: "m-4", player1Id: "p-ghost", player2Id: "p-hawk", score1: 3, score2: 1, mode: "ultimate", season: 2026, sessionId: "session-2", createdBy: "p-blaze", createdAt: "2026-01-17T16:10:00.000Z" },
  { id: "m-5", player1Id: "p-ace", player2Id: "p-cobra", score1: 5, score2: 2, mode: "ultimate", season: 2026, sessionId: "session-2", createdBy: "p-blaze", createdAt: "2026-01-17T16:40:00.000Z" },
  { id: "m-6", player1Id: "p-blaze", player2Id: "p-echo", score1: 1, score2: 3, mode: "squad", season: 2026, sessionId: "session-2", createdBy: "p-blaze", createdAt: "2026-01-17T17:10:00.000Z" },
  { id: "m-7", player1Id: "p-drako", player2Id: "p-fenix", score1: 2, score2: 1, mode: "global95", season: 2026, sessionId: "session-2", createdBy: "p-blaze", createdAt: "2026-01-17T17:45:00.000Z" },
  { id: "m-8", player1Id: "p-ace", player2Id: "p-ghost", score1: 3, score2: 0, mode: "squad", season: 2026, sessionId: "session-3", createdBy: "p-cobra", createdAt: "2026-02-04T19:40:00.000Z" },
  { id: "m-9", player1Id: "p-hawk", player2Id: "p-cobra", score1: 2, score2: 2, mode: "ultimate", season: 2026, sessionId: "session-3", createdBy: "p-cobra", createdAt: "2026-02-04T20:10:00.000Z" },
  { id: "m-10", player1Id: "p-fenix", player2Id: "p-echo", score1: 1, score2: 4, mode: "global95", season: 2026, sessionId: "session-3", createdBy: "p-cobra", createdAt: "2026-02-04T20:40:00.000Z" },
  { id: "m-11", player1Id: "p-ace", player2Id: "p-echo", score1: 3, score2: 2, mode: "squad", season: 2026, createdBy: "p-ace", createdAt: "2026-02-11T18:20:00.000Z" },
  { id: "m-12", player1Id: "p-blaze", player2Id: "p-drako", score1: 0, score2: 5, mode: "ultimate", season: 2026, createdBy: "p-drako", createdAt: "2026-02-11T19:00:00.000Z", notes: "Remontada increíble en el segundo tiempo." },
  { id: "m-13", player1Id: "p-ace", player2Id: "p-fenix", score1: 2, score2: 1, mode: "global95", season: 2026, createdBy: "p-ace", createdAt: "2026-02-18T18:30:00.000Z" },
  { id: "m-14", player1Id: "p-ace", player2Id: "p-hawk", score1: 4, score2: 2, mode: "squad", season: 2026, createdBy: "p-ace", createdAt: "2026-02-25T18:00:00.000Z" },
];

export const DEFAULT_SETTINGS: AppSettings = {
  appName: "FC GOAT Tracker",
  groupName: "Los Panas FC",
  activeSeasonId: "season-2026",
  rules: DEFAULT_RULES,
};
