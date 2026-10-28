import type { AppSettings } from "@/types";
import { DEFAULT_RULES } from "@/types";

/**
 * Configuración por defecto. Los datos reales viven en Supabase: los
 * jugadores se crean al registrarse y `supabase/seed.sql` solo carga las
 * temporadas y esta misma configuración.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  appName: "FC GOAT Tracker",
  groupName: "Los Panas FC",
  rules: DEFAULT_RULES,
};
