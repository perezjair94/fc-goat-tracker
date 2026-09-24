"use server";

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { getServerClient } from "@/lib/supabase/server";
import {
  MATCH_COLUMNS,
  PLAYER_COLUMNS,
  SESSION_COLUMNS,
  SETTINGS_COLUMNS,
  fromSettings,
  toMatch,
  toPlayer,
  toSession,
  toSettings,
  type MatchRow,
  type PlayerRow,
  type SessionRow,
  type SettingsRow,
} from "@/lib/supabase/rows";
import { MATCH_MODES, type AppSettings, type Match, type Player, type Session } from "@/types";
import type { CreateMatchInput, CreateSessionInput } from "@/lib/services/fc-service";

/**
 * Escrituras en Supabase. Corren en el servidor con la sesión del usuario
 * (cookies), así que RLS decide quién puede hacer qué; aquí solo se valida
 * la forma de los datos y se traducen los errores. `created_by` lo pone la
 * base con el jugador de la sesión.
 *
 * Devuelven `ActionResult` en vez de lanzar, porque en producción Next.js
 * oculta el mensaje de los errores lanzados en el servidor.
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const NO_PERMISSION = "No tienes permiso. Inicia sesión y elige tu jugador.";

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
});

const createMatchSchema = matchFields.refine((m) => m.player1Id !== m.player2Id, {
  message: "Un partido necesita dos jugadores distintos.",
});

const createSessionSchema = z.object({
  name: z.string().trim().min(1, "La sesión necesita un nombre.").max(120),
  date: z.iso.date(),
  season: z.number().int().min(2000).max(2100),
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

const signUpSchema = z.object({
  email: z.email("Escribe un email válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(72),
});

function fail<T>(error: unknown): ActionResult<T> {
  if (error instanceof z.ZodError) {
    return { ok: false, error: error.issues[0]?.message ?? "Datos inválidos." };
  }
  const code = (error as { code?: string } | null)?.code;
  if (code === "42501") return { ok: false, error: NO_PERMISSION };
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
  return row;
}

export async function createMatchAction(input: CreateMatchInput): Promise<ActionResult<Match>> {
  try {
    const parsed = createMatchSchema.parse(input);
    const supabase = await getServerClient();
    const { data, error } = await supabase
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
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("matches")
      .update(matchRowPatch(parsed))
      .eq("id", parsedId)
      .select(MATCH_COLUMNS)
      .maybeSingle<MatchRow>();
    if (error) throw error;
    // RLS filtra en silencio: 0 filas = no existe o no es tuyo.
    if (!data) return { ok: false, error: "No existe el partido o no puedes editarlo." };
    return { ok: true, data: toMatch(data) };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteMatchAction(matchId: string): Promise<ActionResult<null>> {
  try {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("matches")
      .delete()
      .eq("id", id.parse(matchId))
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) {
      return { ok: false, error: "Solo quien registró el partido o sus jugadores pueden borrarlo." };
    }
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
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("sessions")
      .insert({ name: parsed.name, date: parsed.date, season: parsed.season })
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
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("app_settings")
      .update({ ...fromSettings(parsed), updated_at: new Date().toISOString() })
      .eq("id", true)
      .select(SETTINGS_COLUMNS)
      .maybeSingle<SettingsRow>();
    if (error) throw error;
    if (!data) return { ok: false, error: NO_PERMISSION };
    return { ok: true, data: toSettings(data) };
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Cuenta
// ---------------------------------------------------------------------------

/**
 * Crea la cuenta ya confirmada con la API de administración. El SMTP por
 * defecto de Supabase solo manda unos pocos correos por hora, así que no se
 * usa confirmación por email. El inicio de sesión lo hace luego el navegador.
 */
export async function signUpAction(email: string, password: string): Promise<ActionResult<null>> {
  try {
    const parsed = signUpSchema.parse({ email, password });
    const { error } = await getAdminClient().auth.admin.createUser({
      email: parsed.email,
      password: parsed.password,
      email_confirm: true,
    });
    if (error) {
      if (error.code === "email_exists") {
        return { ok: false, error: "Ya existe una cuenta con ese email. Inicia sesión." };
      }
      if (error.code === "weak_password") {
        return { ok: false, error: "La contraseña es demasiado débil." };
      }
      throw error;
    }
    return { ok: true, data: null };
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error);
    console.error("[fc-actions] signUp", error);
    return { ok: false, error: "No se pudo crear la cuenta." };
  }
}

/** Vincula la cuenta de la sesión con un jugador que aún no tiene dueño. */
export async function claimPlayerAction(playerId: string): Promise<ActionResult<Player>> {
  try {
    const parsedId = id.parse(playerId);
    const supabase = await getServerClient();
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims.sub;
    if (!userId) return { ok: false, error: "Inicia sesión para elegir tu jugador." };

    const { data, error } = await supabase
      .from("players")
      .update({ user_id: userId })
      .eq("id", parsedId)
      .is("user_id", null)
      .select(PLAYER_COLUMNS)
      .maybeSingle<PlayerRow>();
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Tu cuenta ya tiene un jugador." };
      throw error;
    }
    if (!data) return { ok: false, error: "Ese jugador ya tiene dueño." };
    return { ok: true, data: toPlayer(data) };
  } catch (error) {
    return fail(error);
  }
}
