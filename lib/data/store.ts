import type { AppSettings } from "@/types";
import { DEFAULT_RULES } from "@/types";

/**
 * Configuración por defecto. Los datos reales viven en Supabase: los
 * jugadores se crean al registrarse y `supabase/seed.sql` solo carga la
 * temporada y esta misma configuración.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  appName: "FC GOAT Tracker",
  groupName: "Los Panas FC",
  activeSeasonId: "season-2026",
  rules: DEFAULT_RULES,
};
