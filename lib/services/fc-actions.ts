"use server";

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  MATCH_COLUMNS,
  SESSION_COLUMNS,
  SETTINGS_COLUMNS,
  fromSettings,
  toMatch,
  toSession,
  toSettings,
  type MatchRow,
  type SessionRow,
  type SettingsRow,
} from "@/lib/supabase/rows";
import { MATCH_MODES, type AppSettings, type Match, type Session } from "@/types";
import type { CreateMatchInput, CreateSessionInput } from "@/lib/services/fc-service";

/**
 * Escrituras en Supabase. Corren en el servidor con la service role key.
 *
 * Son endpoints POST públicos: mientras no exista Supabase Auth cualquiera
 * que tenga la URL puede llamarlos, así que validan todo lo que reciben.
 *
 * Devuelven `ActionResult` en vez de lanzar, porque en producción Next.js
 * oculta el mensaje de los errores lanzados en el servidor.
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const id = z.string().trim().min(1).max(128);
const score = z.number().int().min(0).max(99);

const matchFields = z.object({
  player1Id: id,
  player2Id: id,
  score1: score,
  score2: score,
  mode: z.enum(MATCH_MODES),
  season: z.number().int().min(2000).max(2100),
  sessionId: id.optional(),
  notes: z.string().trim().max(1000).optional(),
  evidenceUrl: z.url().max(2048).optional(),
  createdBy: id,
});

const createMatchSchema = matchFields.refine((m) => m.player1Id !== m.player2Id, {
  message: "Un partido necesita dos jugadores distintos.",
});

const createSessionSchema = z.object({
  name: z.string().trim().min(1, "La sesión necesita un nombre.").max(120),
  date: z.iso.date(),
  season: z.number().int().min(2000).max(2100),
  createdBy: id,
});

const nonNegativeInt = z.number().int().min(0).max(100);

const settingsSchema = z.object({
  appName: z.string().trim().min(1).max(80),
  groupName: z.string().trim().min(1).max(80),
  activeSeasonId: id,
  rules: z.object({
    winPoints: nonNegativeInt,
    drawPoints: nonNegativeInt,
    lossPoints: nonNegativeInt,
    koGoalDifference: z.number().int().min(1).max(99),
    koBonusPoints: nonNegativeInt,
  }),
});

function fail<T>(error: unknown): ActionResult<T> {
  if (error instanceof z.ZodError) {
    return { ok: false, error: error.issues[0]?.message ?? "Datos inválidos." };
  }
  const code = (error as { code?: string } | null)?.code;
  if (code === "23503") {
    return { ok: false, error: "Jugador, temporada o sesión inválidos (la sesión debe ser de la misma temporada)." };
  }
  if (code === "23514") return { ok: false, error: "Los datos no cumplen las reglas del partido." };
  if (code === "23505") return { ok: false, error: "Ya existe un registro con esos datos." };
  console.error("[fc-actions]", error);
  return { ok: false, error: "No se pudo guardar en la base de datos." };
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

function matchRowPatch(input: Partial<CreateMatchInput>) {
  const row: Partial<MatchRow> = {};
  if (input.player1Id !== undefined) row.player1_id = input.player1Id;
  if (input.player2Id !== undefined) row.player2_id = input.player2Id;
  if (input.score1 !== undefined) row.score1 = input.score1;
  if (input.score2 !== undefined) row.score2 = input.score2;
  if (input.mode !== undefined) row.mode = input.mode;
  if (input.season !== undefined) row.season = input.season;
  if (input.sessionId !== undefined) row.session_id = input.sessionId;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.evidenceUrl !== undefined) row.evidence_url = input.evidenceUrl;
  if (input.createdBy !== undefined) row.created_by = input.createdBy;
  return row;
}

export async function createMatchAction(input: CreateMatchInput): Promise<ActionResult<Match>> {
  try {
    const parsed = createMatchSchema.parse(input);
    const { data, error } = await getAdminClient()
      .from("matches")
      .insert(matchRowPatch(parsed))
      .select(MATCH_COLUMNS)
      .single<MatchRow>();
    if (error) throw error;
    return { ok: true, data: toMatch(data) };
  } catch (error) {
    return fail(error);
  }
}

export async function updateMatchAction(
  matchId: string,
  patch: Partial<CreateMatchInput>
): Promise<ActionResult<Match>> {
  try {
    const parsedId = id.parse(matchId);
    const parsed = matchFields.partial().parse(patch);
    const { data, error } = await getAdminClient()
      .from("matches")
      .update(matchRowPatch(parsed))
      .eq("id", parsedId)
      .select(MATCH_COLUMNS)
      .maybeSingle<MatchRow>();
    if (error) throw error;
    if (!data) return { ok: false, error: `No existe el partido ${parsedId}.` };
    return { ok: true, data: toMatch(data) };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteMatchAction(matchId: string): Promise<ActionResult<null>> {
  try {
    const { error } = await getAdminClient().from("matches").delete().eq("id", id.parse(matchId));
    if (error) throw error;
    return { ok: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function createSessionAction(input: CreateSessionInput): Promise<ActionResult<Session>> {
  try {
    const parsed = createSessionSchema.parse(input);
    const { data, error } = await getAdminClient()
      .from("sessions")
      .insert({
        name: parsed.name,
        date: parsed.date,
        season: parsed.season,
        created_by: parsed.createdBy,
      })
      .select(SESSION_COLUMNS)
      .single<SessionRow>();
    if (error) throw error;
    return { ok: true, data: toSession(data, []) };
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function saveSettingsAction(settings: AppSettings): Promise<ActionResult<AppSettings>> {
  try {
    const parsed = settingsSchema.parse(settings);
    const { data, error } = await getAdminClient()
      .from("app_settings")
      .upsert({ id: true, ...fromSettings(parsed), updated_at: new Date().toISOString() })
      .select(SETTINGS_COLUMNS)
      .single<SettingsRow>();
    if (error) throw error;
    return { ok: true, data: toSettings(data) };
  } catch (error) {
    return fail(error);
  }
}
