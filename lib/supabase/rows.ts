import { DEFAULT_MATCH_MODE, isMatchMode } from "@/types";
import type { AppSettings, Match, Player, Season, Session } from "@/types";

/**
 * Filas tal como las devuelve Postgres (snake_case) y su traducción a los
 * tipos de dominio. Es el único sitio que conoce los nombres de columna.
 */

export interface PlayerRow {
  id: string;
  name: string;
  handle: string;
  color: string;
  initials: string;
  active: boolean;
  claimed: boolean;
  created_at: string;
}

export interface SeasonRow {
  id: string;
  year: number;
  name: string;
  active: boolean;
}

export interface SessionRow {
  id: string;
  name: string;
  date: string;
  season: number;
  created_by: string;
  created_at: string;
}

export interface MatchRow {
  id: string;
  player1_id: string;
  player2_id: string;
  score1: number;
  score2: number;
  mode: string;
  season: number;
  session_id: string | null;
  notes: string | null;
  evidence_url: string | null;
  created_by: string;
  created_at: string;
}

export interface SettingsRow {
  app_name: string;
  group_name: string;
  active_season_id: string;
  win_points: number;
  draw_points: number;
  loss_points: number;
  ko_goal_difference: number;
  ko_bonus_points: number;
}

export const PLAYER_COLUMNS = "id, name, handle, color, initials, active, claimed, created_at";
export const SEASON_COLUMNS = "id, year, name, active";
export const SESSION_COLUMNS = "id, name, date, season, created_by, created_at";
export const MATCH_COLUMNS =
  "id, player1_id, player2_id, score1, score2, mode, season, session_id, notes, evidence_url, created_by, created_at";
export const SETTINGS_COLUMNS =
  "app_name, group_name, active_season_id, win_points, draw_points, loss_points, ko_goal_difference, ko_bonus_points";

export function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    color: row.color,
    initials: row.initials,
    active: row.active,
    claimed: row.claimed,
    createdAt: row.created_at,
  };
}

export function toSeason(row: SeasonRow): Season {
  return { id: row.id, year: row.year, name: row.name, active: row.active };
}

/** `matchIds` no se guarda: se deriva de `matches.session_id`. */
export function toSession(row: SessionRow, matchIds: string[]): Session {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    season: row.season,
    matchIds,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function toMatch(row: MatchRow): Match {
  return {
    id: row.id,
    player1Id: row.player1_id,
    player2Id: row.player2_id,
    score1: row.score1,
    score2: row.score2,
    mode: isMatchMode(row.mode) ? row.mode : DEFAULT_MATCH_MODE,
    season: row.season,
    sessionId: row.session_id ?? undefined,
    notes: row.notes ?? undefined,
    evidenceUrl: row.evidence_url ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function toSettings(row: SettingsRow): AppSettings {
  return {
    appName: row.app_name,
    groupName: row.group_name,
    activeSeasonId: row.active_season_id,
    rules: {
      winPoints: row.win_points,
      drawPoints: row.draw_points,
      lossPoints: row.loss_points,
      koGoalDifference: row.ko_goal_difference,
      koBonusPoints: row.ko_bonus_points,
    },
  };
}

export function fromSettings(settings: AppSettings): SettingsRow {
  return {
    app_name: settings.appName,
    group_name: settings.groupName,
    active_season_id: settings.activeSeasonId,
    win_points: settings.rules.winPoints,
    draw_points: settings.rules.drawPoints,
    loss_points: settings.rules.lossPoints,
    ko_goal_difference: settings.rules.koGoalDifference,
    ko_bonus_points: settings.rules.koBonusPoints,
  };
}
