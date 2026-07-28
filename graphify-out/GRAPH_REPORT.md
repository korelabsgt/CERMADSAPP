# Graph Report - cermadsapp  (2026-07-28)

## Corpus Check
- 177 files · ~85,117 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 961 nodes · 1909 edges · 75 communities (41 shown, 34 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fb44badc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createClient
- lib/infile.ts
- useUser
- ventas/lib/actions.ts
- clientes/index.tsx
- InfoUser.tsx
- productos/lib/actions.ts
- devDependencies
- estadisticas/stats.tsx
- creditos/index.tsx
- compilerOptions
- cn
- dialog.tsx
- components.json
- ventas-view.tsx
- form.tsx
- DevicesAccordion.tsx
- utils.ts
- client-sales-modal.tsx
- dependencies
- (settings)/hooks.ts
- contabilidad/index.tsx
- weather/route.ts
- select.tsx
- sheet.tsx
- cropImage.ts
- dock.tsx
- stats-accordion.tsx
- particles.tsx
- Guía: subir y eliminar imágenes (`components/imgs`)
- notificaciones_resumen.md
- src/proxy.ts
- ConnectivityShell.tsx
- install-graphify.md
- README.md
- eslint.config.mjs
- file-saver
- framer-motion
- @hookform/resolvers
- jspdf-autotable
- lucide-react
- motion
- next
- next.config.ts
- next-themes
- @radix-ui/react-avatar
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-popover
- @radix-ui/react-select
- @radix-ui/react-slot
- react-dom
- react-easy-crop
- react-hook-form
- @react-pdf/renderer
- react-toastify
- recharts
- @simplewebauthn/server
- @supabase/ssr
- sweetalert2
- @sweetalert2/theme-dark
- tailwind-merge
- @tanstack/react-query
- web-push
- postcss.config.mjs
- health/route.ts
- clsx
- global.d.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 157 edges
2. `createClient()` - 72 edges
3. `useUser()` - 32 edges
4. `compilerOptions` - 16 edges
5. `ClientSalesModalContent()` - 14 edges
6. `createClient()` - 14 edges
7. `Creditos()` - 11 edges
8. `DetalleCreditoModal()` - 11 edges
9. `ListadoClientes()` - 10 edges
10. `ReceiptModal()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `ScaledDocument()` --references--> `react`  [EXTRACTED]
  src/components/(LaArada)/ventas/modals/receipt-modal.tsx → package.json
- `ContabilidadView()` --references--> `jspdf`  [EXTRACTED]
  src/components/(LaArada)/contabilidad/index.tsx → package.json
- `FormItem()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `ContabilidadView()` --references--> `xlsx`  [EXTRACTED]
  src/components/(LaArada)/contabilidad/index.tsx → package.json

## Import Cycles
- None detected.

## Communities (75 total, 34 thin omitted)

### Community 0 - "createClient"
Cohesion: 0.06
Nodes (53): logout(), POST(), DELETE(), POST(), checkDeviceRequest(), createDeviceRequest(), notifyAdminsOfArrival(), notifySpecialRoles() (+45 more)

### Community 1 - "lib/infile.ts"
Cohesion: 0.08
Nodes (54): POST(), POST(), getVentaById(), isConsumidorFinalNit(), printHtmlContent(), RECEIPT_DOC_W_PX, ReceiptModal(), ReceiptModalProps (+46 more)

### Community 2 - "useUser"
Cohesion: 0.05
Nodes (40): geistMono, geistSans, metadata, RootLayout(), viewport, ActionState, getAdminClient(), signup() (+32 more)

### Community 3 - "ventas/lib/actions.ts"
Cohesion: 0.08
Nodes (41): Estadisticas(), getGuatemalaDateParts(), getOrderDateString(), getWeeksLabels(), MonitorView(), ListadoVentas(), createVenta(), getCatalogos() (+33 more)

### Community 4 - "clientes/index.tsx"
Cohesion: 0.12
Nodes (33): ListadoClientes(), createClientAction(), deleteClientAction(), getClientDeletionPreview(), getClients(), getClientSalesAction(), isVentaAnulada(), mapDeleteClientError() (+25 more)

### Community 5 - "InfoUser.tsx"
Cohesion: 0.13
Nodes (25): InfoPerfil(), InfoPerfilProps, Input(), Label(), Select(), InfoUser(), InfoUserProps, StatusSwitch() (+17 more)

### Community 6 - "productos/lib/actions.ts"
Cohesion: 0.10
Nodes (28): DashboardLaArada(), WELCOME_PHRASES, ListadoProductos(), ProductoCatalogo, createProduct(), deleteProduct(), getAllProductsStats(), getLowStockCount() (+20 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (33): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+25 more)

### Community 8 - "estadisticas/stats.tsx"
Cohesion: 0.10
Nodes (22): EstadisticasDataSkeleton(), EstadisticasPageSkeleton(), CHART_COLORS, ChartTooltipContent(), CurrencyValue(), formatCompactMoney(), formatMoneyAmount(), MobileBarChart() (+14 more)

### Community 9 - "creditos/index.tsx"
Cohesion: 0.09
Nodes (37): CreditosListProps, ReciboAbonoPrint(), Creditos(), DIAS_SEMANA, formatDateShort(), formatFelNumero(), formatMoney(), getFelCertificado() (+29 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 11 - "cn"
Cohesion: 0.09
Nodes (31): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), Card(), CardAction() (+23 more)

### Community 12 - "dialog.tsx"
Cohesion: 0.13
Nodes (14): COLORS, MONTHS, StatsModalProps, Button(), buttonVariants, Dialog(), DialogContent(), DialogDescription() (+6 more)

### Community 13 - "components.json"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 14 - "ventas-view.tsx"
Cohesion: 0.10
Nodes (21): AdminCards(), adminOptions, ClientRowActionsProps, getGuatemalaDateParts(), getOrderDateString(), getWeeksLabels(), ListView(), MONTH_SHORT (+13 more)

### Community 15 - "form.tsx"
Cohesion: 0.16
Nodes (14): react, react, ScaledDocument(), FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem() (+6 more)

### Community 16 - "DevicesAccordion.tsx"
Cohesion: 0.17
Nodes (11): authorizeDevice(), denyDevice(), supabaseAdmin, supabaseServiceKey, supabaseUrl, AuthorizeButton(), Device, DevicesAccordion() (+3 more)

### Community 17 - "utils.ts"
Cohesion: 0.09
Nodes (14): Dashboard(), MONTHS, StatCard(), Stats(), YearlyDetailCard(), Badge(), badgeVariants, BorderBeam() (+6 more)

### Community 18 - "client-sales-modal.tsx"
Cohesion: 0.16
Nodes (21): ClientSale, ClientSalesModal(), ClientSalesModalContent(), ClientSalesModalProps, DIAS_SEMANA, DteDocumento, FILTRO_COMPROBANTE_OPTIONS, FiltroComprobante (+13 more)

### Community 19 - "dependencies"
Cohesion: 0.13
Nodes (15): browser-image-compression, class-variance-authority, date-fns, dependencies, browser-image-compression, class-variance-authority, date-fns, @radix-ui/react-separator (+7 more)

### Community 20 - "(settings)/hooks.ts"
Cohesion: 0.31
Nodes (7): getAppSettings(), updateAppSettings(), useAppSettings(), useUpdateAppSettings(), AppSettings(), appSettingsSchema, AppSettingsUpdate

### Community 21 - "contabilidad/index.tsx"
Cohesion: 0.21
Nodes (9): jspdf, jspdf, xlsx, ContabilidadView(), FEL_ONLY_ROLES, FULL_ACCESS_ROLES, getFileName(), StatCard() (+1 more)

### Community 22 - "weather/route.ts"
Cohesion: 0.35
Nodes (10): buildSummary(), DayWeather, fetchEnsembleMonth(), fillMonthGaps(), GET(), getGuatemalaToday(), mergeDays(), parseDailyWeather() (+2 more)

### Community 23 - "select.tsx"
Cohesion: 0.18
Nodes (7): SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger()

### Community 24 - "sheet.tsx"
Cohesion: 0.18
Nodes (6): SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 25 - "cropImage.ts"
Cohesion: 0.42
Nodes (7): Area, createImage(), getCroppedFile(), getRadianAngle(), rotateSize(), ImageEditorModal(), ImageEditorModalProps

### Community 26 - "dock.tsx"
Cohesion: 0.25
Nodes (8): Dock, DockContext, DockContextProps, DockIcon(), DockIconProps, DockProps, dockVariants, useDock()

### Community 27 - "stats-accordion.tsx"
Cohesion: 0.40
Nodes (5): MONTHS, StatCard(), StatsAccordion(), YearlyDetailCard(), getProductStats()

### Community 28 - "particles.tsx"
Cohesion: 0.47
Nodes (5): Circle, hexToRgb(), MousePosition, Particles(), ParticlesProps

### Community 29 - "Guía: subir y eliminar imágenes (`components/imgs`)"
Cohesion: 0.11
Nodes (17): 1. Configurar Supabase Storage, 2. API de `ImageUploader`, 3. Flujo de subida, 4. Flujo de eliminación, 5. Integración en un formulario (ej. ventas), 6. Checklist para un módulo nuevo, Archivos del módulo, Buckets en uso (+9 more)

### Community 30 - "notificaciones_resumen.md"
Cohesion: 0.14
Nodes (13): 1. INSTALACION DE DEPENDENCIAS, 2. ESTRUCTURA DE ARCHIVOS, 3. VARIABLES DE ENTORNO Y LLAVES VAPID, 4. ESQUEMA SQL (BASE DE DATOS), Copia y ejecuta este script en tu consola de SQL de #Supabase para crear la tabla de almacenamiento necesaria:, Ejecutar el siguiente comando para instalar las librerías necesarias:, Este documento sirve como hoja de ruta para habilitar el sistema de notificaciones web push en la aplicación CERMAD., Habilitar RLS (Row Level Security) (+5 more)

### Community 31 - "src/proxy.ts"
Cohesion: 0.60
Nodes (3): config, proxy(), createClient()

### Community 32 - "ConnectivityShell.tsx"
Cohesion: 0.26
Nodes (10): bannerEase, ConnectivityShell(), STATUS_CONFIG, StatusConfig, ConnectivityStatus, getNetworkConnection(), isSlowConnection(), NetworkConnection (+2 more)

### Community 33 - "install-graphify.md"
Cohesion: 0.22
Nodes (8): En un proyecto nuevo o diferente, En un proyecto nuevo o diferente, Guía rápida de Graphify para cursor, Guía rápida de Graphify para Google Antigravity, Mantenimiento, Mantenimiento, Primera vez en Antigravity, Primera vez (Instalación completa)

### Community 35 - "README.md"
Cohesion: 0.40
Nodes (4): Deploy on Vercel, Getting Started, Learn More, thecarsplacelotinc

## Knowledge Gaps
- **262 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+257 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `createClient`, `useUser`, `ventas/lib/actions.ts`, `InfoUser.tsx`, `productos/lib/actions.ts`, `estadisticas/stats.tsx`, `creditos/index.tsx`, `dialog.tsx`, `ventas-view.tsx`, `form.tsx`, `DevicesAccordion.tsx`, `utils.ts`, `client-sales-modal.tsx`, `contabilidad/index.tsx`, `select.tsx`, `sheet.tsx`, `dock.tsx`, `stats-accordion.tsx`, `particles.tsx`, `ConnectivityShell.tsx`?**
  _High betweenness centrality (0.354) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `form.tsx`, `contabilidad/index.tsx`, `file-saver`, `framer-motion`, `@hookform/resolvers`, `jspdf-autotable`, `lucide-react`, `motion`, `next`, `next-themes`, `@radix-ui/react-avatar`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-popover`, `@radix-ui/react-select`, `@radix-ui/react-slot`, `react-dom`, `react-easy-crop`, `react-hook-form`, `@react-pdf/renderer`, `react-toastify`, `recharts`, `@simplewebauthn/server`, `@supabase/ssr`, `sweetalert2`, `@sweetalert2/theme-dark`, `tailwind-merge`, `@tanstack/react-query`, `web-push`, `clsx`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Why does `ContabilidadView()` connect `contabilidad/index.tsx` to `cn`, `useUser`, `ventas/lib/actions.ts`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _262 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.055501460564751706 - nodes in this community are weakly interconnected._
- **Should `lib/infile.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07759562841530054 - nodes in this community are weakly interconnected._
- **Should `useUser` be split into smaller, more focused modules?**
  _Cohesion score 0.052917232021709636 - nodes in this community are weakly interconnected._