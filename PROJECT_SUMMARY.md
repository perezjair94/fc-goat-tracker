# FC GOAT Tracker — Resumen técnico completo

> Documento de transferencia para el desarrollador que continuará el proyecto en Claude.
> Estado descrito según el código actual del repositorio.

## 1. Visión general y objetivo

FC GOAT Tracker es una aplicación privada para registrar, consultar y comparar partidos amistosos de EA Sports FC entre un grupo de jugadores. Su objetivo principal es convertir el historial de partidos en una clasificación GOAT transparente, calculada a partir de resultados reales y no de contadores editables manualmente.

La fuente de verdad conceptual es el historial de partidos. A partir de cada partido se derivan ranking, victorias, empates, derrotas, goles, diferencia de goles, K.O., win rate y puntos GOAT.

### Reglas de negocio actuales

- Victoria: `3` puntos.
- Empate: `1` punto.
- Derrota: `0` puntos.
- K.O.: diferencia absoluta de goles mayor o igual a `5`.
- Bonus de K.O.: `+2` puntos para el jugador ganador.
- El K.O. nunca se introduce manualmente: se calcula desde el marcador.
- En caso de empate no existe bonus de K.O.
- El ranking se ordena por puntos y, como desempate, por win rate.

## 2. Stack y arquitectura actual

- Next.js 16 con App Router.
- React y TypeScript.
- Tailwind CSS v4 mediante `@import 'tailwindcss'`.
- shadcn/ui con preset `base-nova`, componentes basados en variables CSS.
- Lucide React para iconografía.
- Vercel Analytics en producción.
- Persistencia local temporal mediante `localStorage`.
- No hay todavía base de datos, autenticación, API route ni Supabase conectado.

### Arquitectura por capas

1. **UI y rutas**: `app/` y `components/`.
2. **Tipos de dominio**: `types/index.ts`.
3. **Datos seed/mock**: `lib/data/store.ts` y `lib/fc-data.ts`.
4. **Servicios de dominio**: `lib/services/fc-service.ts`.
5. **Reglas puras**: funciones de cálculo en `types/index.ts`.

La intención es que `lib/services/fc-service.ts` sea el límite de persistencia. La UI debería consumir sus funciones sin acoplarse a `localStorage`, para poder sustituir la implementación por Supabase manteniendo las firmas públicas.

## 3. Estructura actual de archivos y carpetas

```text
/
├── app/
│   ├── layout.tsx                         # Metadata, viewport, Analytics y tema global
│   ├── page.tsx                           # Entrada principal / dashboard visual original
│   ├── globals.css                        # Tailwind, tokens shadcn y estilos globales
│   └── (workspace)/
│       ├── layout.tsx                     # Shell compartido de rutas workspace
│       ├── generic-pages.tsx              # Vistas placeholder compartidas
│       ├── ranking/page.tsx                # Ranking GOAT
│       ├── players/page.tsx                # Listado de jugadores
│       ├── players/[id]/page.tsx          # Perfil de jugador
│       ├── matches/new/page.tsx            # Formulario para registrar partido
│       ├── matches/[id]/page.tsx           # Detalle de partido
│       ├── history/page.tsx                # Historial
│       ├── sessions/page.tsx               # Sesiones
│       ├── sessions/[id]/page.tsx          # Detalle de sesión
│       ├── head-to-head/page.tsx           # Enfrentamientos
│       ├── statistics/page.tsx             # Estadísticas
│       └── settings/page.tsx               # Configuración
├── components/
│   ├── fc-dashboard.tsx                   # Dashboard visual principal y modal de registro
│   ├── workspace-nav.tsx                  # Sidebar con navegación real basada en href
│   └── ui/button.tsx                      # Button de shadcn preinstalado
├── lib/
│   ├── fc-data.ts                         # Dataset visual legacy/mock del dashboard original
│   ├── data/store.ts                      # Dataset tipado de dominio
│   ├── services/fc-service.ts              # Persistencia local y cálculos derivados
│   └── utils.ts                           # cn() y utilidades base
├── types/index.ts                          # Tipos, reglas y funciones de resultado
├── public/                                 # Iconos, logos y placeholders del scaffold
├── components.json                         # Configuración shadcn base-nova / Lucide
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── README.md                              # Documentación inicial
├── PROJECT_CONTEXT.md                     # Contexto para futuros desarrolladores
└── PROJECT_SUMMARY.md                     # Este documento
```

## 4. Páginas, vistas y rutas

### `/`

Dashboard visual principal de la primera iteración. Incluye sidebar, header, hero del GOAT actual, métricas, progresión, ranking, pulso de temporada y partidos recientes. El componente `FCDashboard` también conserva un flujo de modal para registrar partidos.

### `/matches/new`

Formulario funcional de registro de partido. Permite seleccionar dos jugadores, introducir ambos marcadores y añadir notas. Valida que los jugadores sean distintos, crea un `Match` mediante `createMatch()` y redirige a `/history`.

El formulario calcula en pantalla el ganador y muestra si el marcador constituye K.O. utilizando las reglas actuales.

### `/history`

Vista del historial de partidos. Actualmente está conectada a la capa de rutas workspace, pero debe revisarse si el contenido es todavía placeholder o si necesita una tabla completa con acciones.

### `/matches/[id]`

Ruta prevista para detalle individual de partido. Debe mostrar participantes, resultado, reglas aplicadas, K.O., puntos y evidencia cuando exista.

### `/ranking`

Ruta prevista para el ranking GOAT. El servicio `getRanking()` ya puede producir las entradas derivadas; falta asegurar que la vista use el servicio y presente filtros, orden y enlaces de detalle.

### `/players`

Ruta prevista para el listado de jugadores. Debe usar `getPlayers()` y enlazar a perfiles individuales.

### `/players/[id]`

Ruta prevista para perfil de jugador. Debe incluir ranking, partidos, forma, goles, K.O., win rate y enfrentamientos.

### `/head-to-head`

Ruta prevista para comparar dos jugadores. El tipo `HeadToHead` existe, pero todavía falta implementar el servicio y la experiencia completa de comparación.

### `/sessions`

Listado de sesiones de juego. La capa seed contiene sesiones, pero no hay todavía CRUD completo de sesiones.

### `/sessions/[id]`

Detalle de sesión y partidos agrupados. Requiere conexión completa con `sessionId` y una UI de resumen.

### `/statistics`

Vista prevista para estadísticas agregadas, gráficos y métricas derivadas.

### `/settings`

Vista prevista para nombre de aplicación, grupo, temporada activa y reglas GOAT editables. Actualmente `getSettings()` devuelve configuración seed, pero falta hacerla editable y persistente.

## 5. Inventario de componentes UI

### `FCDashboard`

Componente cliente principal de la primera experiencia visual. Mantiene estado local para navegación, sidebar colapsado, menú móvil, modal de registro y partidos agregados durante la sesión.

Subcomponentes incluidos en el mismo archivo:

- `Avatar`: avatar circular basado en iniciales y color del jugador.
- `SideNav`: navegación lateral desktop con estado activo y modo colapsado.
- `Header`: título contextual, búsqueda visual, notificaciones y CTA de registrar partido.
- `MetricCard`: tarjeta de métrica con icono, valor y delta.
- `GoatHero`: tarjeta destacada del jugador líder.
- `PerformanceChart`: gráfico visual de barras usando datos simulados.
- `RankingTable`: tabla expandible de ranking, inicialmente limitada a cinco filas.
- `MatchRow`: fila compacta con jugadores, marcador, estado y K.O.
- `RecentMatches`: lista de partidos recientes.
- `SeasonPulse`: panel visual con distribución de forma/temporada.
- `RegisterModal`: modal custom para registrar partido desde el dashboard; muestra resumen de guardado, ganador y K.O.
- `DashboardContent`: composición principal del dashboard.
- `PlaceholderView`: pantalla de fallback para secciones todavía no terminadas.

### `WorkspaceNav`

Sidebar compartido para las rutas App Router. Usa `next/link` y `usePathname()` para activar el enlace actual. Incluye Dashboard, registrar partido, sesiones, ranking, jugadores, enfrentamientos, historial, estadísticas y configuración.

### Componentes shadcn/Tailwind/Lucide

- `components/ui/button.tsx`: componente `Button` de shadcn, usado en CTAs, botones del modal y acciones del dashboard.
- Tailwind se usa directamente para layout, spacing, estados hover, responsive y superficies.
- Lucide React usado en el dashboard y navegación: `Trophy`, `Plus`, `Swords`, `Users`, `History`, `BarChart3`, `Layers3`, `Settings2`, `Grid2X2`, `Menu`, `Bell`, `Search`, `ArrowUpRight`, `ArrowDownRight`, `Flame`, `Zap`, `CalendarDays`, `ChevronDown`, `CircleHelp`, `MoreHorizontal`, `X`, entre otros.
- No se han instalado todavía `Card`, `Dialog`, `Table`, `Select`, `Input`, `Tabs`, `Badge`, `Toast` u otros componentes shadcn. Varias piezas están hechas con HTML semántico y clases Tailwind custom.

## 6. Estado actual, flujos e interacciones

### Dashboard original

- Sidebar desktop visible desde `md`.
- Menú móvil con overlay.
- Sidebar colapsable visualmente.
- Cambio de sección interno mediante estado `active` en `FCDashboard`.
- Botón `Registrar partido` abre modal.
- Ranking puede expandirse de cinco a todas las filas.
- Métricas y gráficos muestran datos mock.
- Partidos recientes muestran marcador y etiqueta `WIN`, `DRAW`, `LOSS` o `K.O.`.
- El modal de registro muestra confirmación después de guardar y añade el partido al inicio de la lista local del dashboard.

### Ruta `/matches/new`

- Selección de jugadores.
- Inputs numéricos de marcador con mínimo cero.
- Campo de notas.
- Cálculo del ganador en vivo.
- Detección visual de K.O.
- Prevención de selección del mismo jugador.
- Persistencia mediante `createMatch()`.
- Redirección a `/history` tras guardar.

### Persistencia local

`fc-service.ts` usa la clave `fc-goat-state` en `localStorage` con esta forma:

```ts
{
  players: Player[],
  matches: Match[]
}
```

En SSR o cuando no existe `window`, se devuelven los seeds del servidor. `createMatch()` genera `id` mediante `crypto.randomUUID()`, agrega `createdAt` y guarda el estado.

### Datos mock/domain actuales

#### Jugadores seed

Ace, Blaze, Cobra, Drako, Echo, Fenix, Ghost y Hawk. Cada jugador tiene id, nombre, handle, color, iniciales, estado activo y fecha de creación en el dataset de dominio.

#### Partidos seed

Existen varios partidos de ejemplo con jugadores, marcadores, temporada `2026`, sesiones opcionales, notas/evidencia en algunos registros y `createdBy`.

El dashboard legacy mantiene además un dataset paralelo en `lib/fc-data.ts` con seis partidos, ranking estático de ocho jugadores, timeline de puntos y barras de progreso. Este dataset se usa para la primera UI y no debe confundirse con el nuevo servicio de dominio.

#### Sesiones, temporadas y settings

`lib/data/store.ts` incluye seeds para sesiones, temporadas y settings. Su consumo actual es limitado y debe conectarse a páginas reales.

## 7. Estilos, paleta y diseño

### Dirección visual

La interfaz sigue una estética de dashboard deportivo/esports premium:

- Fondo casi negro.
- Superficies oscuras elevadas.
- Acento lima/ácido para CTA, ranking líder y estado activo.
- Coral cálido para K.O. y estados de alto impacto.
- Tipografía sans-serif pesada y condensada visualmente mediante pesos y tracking.
- Bordes finos y transparentes.
- Tarjetas con radios medianos/grandes.
- Layout desktop con sidebar fijo y contenido responsive.
- Layout móvil con navegación overlay.

### Colores principales usados

- Fondo principal: `#0b0d0e`.
- Superficie principal: `#111415`.
- Superficie hero: `#141818` / `#151919`.
- Verde lima GOAT: `#d4ff45`.
- Verde secundario: `#b8e944`.
- Coral K.O.: `#ff8069` y `#ff9b87`.
- Texto blanco principal: `#ffffff`.
- Texto secundario: blancos con opacidad entre `30%` y `65%`.
- Bordes: blancos con opacidad baja.

### Tema

`app/layout.tsx` fuerza `<html className="dark">`. `globals.css` mantiene tokens shadcn para light/dark, pero la UI actual utiliza mayoritariamente colores hexadecimales directos y superficies dark custom. El viewport declara `colorScheme: 'light dark'`, aunque la experiencia real está diseñada para dark mode.

### Responsive

- Sidebar desktop a partir de `md`.
- Menú móvil con botón hamburguesa.
- Tablas con overflow horizontal.
- Grids que pasan de columnas múltiples a una columna.
- Acciones secundarias ocultas en pantallas pequeñas cuando conviene.

## 8. Pendientes, errores conocidos y refactorizaciones necesarias

### Prioridad alta

1. **Unificar las dos arquitecturas de UI.** Actualmente conviven el dashboard legacy de `components/fc-dashboard.tsx` y las rutas workspace nuevas. Hay que decidir si el dashboard original se conserva como landing/dashboard final o si se reemplaza por una composición basada en rutas compartidas.
2. **Completar todas las vistas workspace.** Varias páginas todavía son placeholders o wrappers mínimos. Falta implementar tablas, tarjetas, filtros, estados vacíos, enlaces y acciones reales.
3. **Eliminar el dataset duplicado.** `lib/fc-data.ts` y `lib/data/store.ts` representan modelos diferentes (`home/away` frente a `player1Id/player2Id`). Debe existir una única fuente mock/domain.
4. **Migrar a Supabase.** Crear tablas para `players`, `matches`, `sessions`, `seasons`, `evidence` y usuarios/auth. Sustituir `localStorage` por consultas Supabase dentro del servicio.
5. **Añadir autenticación y RLS.** Usar Supabase Auth y políticas RLS por grupo/usuario. `createdBy` debe provenir de la sesión, no estar hardcodeado como `ace`.
6. **Validación de formularios.** Migrar de controles HTML ad hoc a componentes shadcn y validación centralizada con Zod o equivalente. Validar marcador, jugador distinto, temporada, sesión y notas.

### Prioridad media

- Implementar eliminar y editar partidos con confirmación.
- Implementar detalle de partido real y enlaces desde historial.
- Implementar perfiles de jugador con estadísticas derivadas.
- Implementar head-to-head con servicio de comparación.
- Implementar sesiones y agrupación de partidos.
- Implementar configuración editable y reglas configurables.
- Implementar subida de evidencia a Supabase Storage.
- Añadir filtros por temporada, jugador, sesión y rango de fechas.
- Añadir paginación o virtualización para historiales grandes.
- Añadir estados de carga, error y empty states.
- Añadir toasts accesibles tras acciones.
- Añadir accesibilidad completa: labels, focus trap real en modal, teclado, roles y navegación por teclado.

### Errores o riesgos conocidos

- `localStorage` no es persistencia multiusuario ni segura; solo sirve como prototipo.
- `getRanking()` calcula `currentStreak` y `bestStreak` como el número de victorias, no como una racha cronológica real. Debe corregirse ordenando partidos por fecha/hora y recorriendo resultados consecutivos.
- La función de puntos deriva puntos desde el partido y reglas default, pero el ranking no expone todavía una explicación de puntos por partido.
- La navegación visual interna de `FCDashboard` y `WorkspaceNav` puede producir experiencias inconsistentes.
- Hay iconos y botones que son puramente decorativos o todavía no tienen handler.
- La búsqueda, campana/notificaciones y selector de temporada del dashboard son visuales, no funcionales.
- El modal legacy usa un modal custom en lugar de `Dialog` de shadcn y no garantiza un focus trap completo.
- `FCDashboard` contiene demasiados subcomponentes en un único archivo y debe dividirse.
- La UI usa muchos colores hexadecimales directos; conviene migrarlos a tokens semánticos para mantener el tema.
- La metadata indica `lang="en"`, aunque gran parte de la interfaz está en español; debe cambiarse a `lang="es"` si el producto seguirá en español.
- Hay placeholders públicos en `public/` heredados del scaffold que deben sustituirse o eliminarse si no se usan.
- La documentación inicial menciona Supabase como siguiente paso, pero todavía no hay integración conectada ni variables de entorno configuradas.

## 9. Plan recomendado para continuar en Claude

1. Elegir la arquitectura definitiva: dashboard único con rutas reales.
2. Normalizar tipos y eliminar `lib/fc-data.ts` o convertirlo al modelo de `types/index.ts`.
3. Extraer componentes UI compartidos: `AppShell`, `PageHeader`, `PlayerAvatar`, `StatCard`, `DataTable`, `EmptyState`, `MatchForm`, `MatchCard`.
4. Completar primero ranking, historial, jugadores y detalle de partido.
5. Corregir rachas y todas las estadísticas para que sean cronológicas y derivadas.
6. Integrar Supabase, Auth, RLS y Storage.
7. Añadir pruebas para reglas: victoria, empate, derrota, K.O., puntos, diferencia de goles, ranking y rachas.
8. Verificar navegación y flujos con tests de navegador en desktop y móvil.

## 10. Comandos de desarrollo

```bash
pnpm install
pnpm dev
pnpm build
```

El proyecto usa `pnpm`. Las rutas deben probarse en el preview de Next.js, especialmente `/`, `/matches/new`, `/history`, `/ranking`, `/players`, `/head-to-head`, `/sessions`, `/statistics` y `/settings`.

## 11. Reglas que no deben cambiar sin autorización

- Umbral K.O.: diferencia de goles `>= 5`.
- Victoria: `3` puntos.
- Empate: `1` punto.
- Derrota: `0` puntos.
- Bonus K.O.: `+2` puntos.
- Las estadísticas y el ranking deben derivarse de partidos; no guardar contadores independientes como fuente de verdad.
- La capa de servicio debe permanecer separada de los componentes visuales para facilitar la migración a Supabase.
