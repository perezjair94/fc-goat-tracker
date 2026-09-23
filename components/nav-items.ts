import {
  BarChart3,
  CalendarDays,
  History,
  LayoutGrid,
  Plus,
  Settings2,
  Swords,
  Trophy,
  Users,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/matches/new", label: "Registrar partido", icon: Plus },
  { href: "/sessions", label: "Sesiones", icon: CalendarDays },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/players", label: "Jugadores", icon: Users },
  { href: "/head-to-head", label: "Enfrentamientos", icon: Swords },
  { href: "/history", label: "Historial", icon: History },
  { href: "/statistics", label: "Estadísticas", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings2 },
];
