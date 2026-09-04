# Graph Report - cermadsapp  (2026-09-04)

## Corpus Check
- 212 files · ~119,908 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1273 nodes · 2887 edges · 97 communities (56 shown, 41 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `35b8816b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LogIn.tsx
- lib/infile.ts
- preventas/lib/actions.ts
- createClient
- client-sales-modal.tsx
- InfoUser.tsx
- productos/lib/actions.ts
- devDependencies
- estadisticas/stats.tsx
- detalle-credito-modal.tsx
- compilerOptions
- dropdown-menu.tsx
- dialog.tsx
- components.json
- recibo-preventa-print.tsx
- form.tsx
- DevicesAccordion.tsx
- formatMoney
- @sweetalert2/theme-dark
- dependencies
- (settings)/hooks.ts
- export-reporte-pdf.ts
- weather/route.ts
- export-movimientos-pdf.ts
- sheet.tsx
- ImageUploader.tsx
- dock.tsx
- monitor-view.tsx
- particles.tsx
- Guía: subir y eliminar imágenes (`components/imgs`)
- notificaciones_resumen.md
- src/proxy.ts
- ConnectivityShell.tsx
- install-graphify.md
- README.md
- eslint.config.mjs
- jspdf
- framer-motion
- @hookform/resolvers
- jspdf-autotable
- lucide-react
- motion
- next
- next.config.ts
- ventas-view.tsx
- @radix-ui/react-avatar
- @radix-ui/react-dialog
- SignUp.tsx
- @radix-ui/react-label
- @radix-ui/react-popover
- @radix-ui/react-select
- badge.tsx
- web-push
- react-easy-crop
- react-hook-form
- @supabase/supabase-js
- react-toastify
- recharts
- @simplewebauthn/server
- agregar-producto-preventa.tsx
- sweetalert2
- clsx
- tailwind-merge
- preventas/lib/zod.ts
- file-saver
- postcss.config.mjs
- health/route.ts
- useUser
- global.d.ts
- PreventaCliente.tsx
- ventas/index.tsx
- AnimatedIcon.tsx
- header.tsx
- CargarSaldo.tsx
- cn
- stats-accordion.tsx
- html2canvas
- @radix-ui/react-separator
- html-to-image
- zod
- utils.ts
- @radix-ui/react-dropdown-menu
- dashboard/index.tsx
- date-fns
- layout.tsx
- constancia-thumb.tsx
- @radix-ui/react-slot
- @tanstack/react-query
- react-dom
- table-pagination.tsx
- @react-pdf/renderer

## God Nodes (most connected - your core abstractions)
1. `cn()` - 204 edges
2. `createClient()` - 90 edges
3. `useUser()` - 36 edges
4. `formatMoney()` - 26 edges
5. `DetalleCreditoModal()` - 23 edges
6. `createClient()` - 20 edges
7. `PreventaCliente()` - 19 edges
8. `requireAuthenticatedCajero()` - 18 edges
9. `Supabase` - 17 edges
10. `anularFacturaPreventa()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `ScaledDocument()` --references--> `react`  [EXTRACTED]
  src/components/(LaArada)/preventas/components/recibo-preventa-print.tsx → package.json
- `ScaledDocument()` --references--> `react`  [EXTRACTED]
  src/components/(LaArada)/ventas/modals/receipt-modal.tsx → package.json
- `FacturaPreventaTicket()` --references--> `qrcode`  [EXTRACTED]
  src/components/(LaArada)/preventas/components/recibo-preventa-print.tsx → package.json
- `FormItem()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json

## Import Cycles
- None detected.

## Communities (97 total, 41 thin omitted)

### Community 0 - "LogIn.tsx"
Cohesion: 0.09
Nodes (27): ActionState, getPublicAppSettings(), login(), LogIn(), PasskeyPrompt(), getPasskeyOptions(), getPasskeys(), getPasskeysCount() (+19 more)

### Community 1 - "lib/infile.ts"
Cohesion: 0.08
Nodes (54): POST(), POST(), getVentaById(), isConsumidorFinalNit(), printHtmlContent(), RECEIPT_DOC_W_PX, ReceiptModal(), ReceiptModalProps (+46 more)

### Community 2 - "preventas/lib/actions.ts"
Cohesion: 0.14
Nodes (35): actualizarComprobantePreventa(), anularFacturaPreventa(), aplicarPreventa(), buildItemsDTE(), certificarFacturaPreventa(), certificarPreventaExistente(), computeSaldo(), crearPreventa() (+27 more)

### Community 3 - "createClient"
Cohesion: 0.05
Nodes (71): logout(), POST(), DELETE(), POST(), checkDeviceRequest(), createDeviceRequest(), notifyAdminsOfArrival(), notifySpecialRoles() (+63 more)

### Community 4 - "client-sales-modal.tsx"
Cohesion: 0.07
Nodes (54): ListadoClientes(), createClientAction(), deleteClientAction(), getClientDeletionPreview(), getClients(), getClientSalesAction(), isVentaAnulada(), mapDeleteClientError() (+46 more)

### Community 5 - "InfoUser.tsx"
Cohesion: 0.13
Nodes (25): InfoPerfil(), InfoPerfilProps, Input(), Label(), Select(), InfoUser(), InfoUserProps, StatusSwitch() (+17 more)

### Community 6 - "productos/lib/actions.ts"
Cohesion: 0.14
Nodes (23): ListadoProductos(), ProductoCatalogo, createProduct(), deleteProduct(), getAllProductsStats(), getLowStockCount(), getNextProductCode(), getProducts() (+15 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (35): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+27 more)

### Community 8 - "estadisticas/stats.tsx"
Cohesion: 0.09
Nodes (26): EstadisticasDataSkeleton(), EstadisticasPageSkeleton(), Estadisticas(), PeriodPicker(), toPeriodKey(), CHART_COLORS, ChartTooltipContent(), createBarAmountLabel() (+18 more)

### Community 9 - "detalle-credito-modal.tsx"
Cohesion: 0.06
Nodes (67): CreditosList(), CreditosListProps, formatDeuda(), PAGE_SIZE_OPTIONS, PageSize, ReciboAbonoPrint(), DetalleCreditoCliente(), Creditos() (+59 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 11 - "dropdown-menu.tsx"
Cohesion: 0.12
Nodes (11): DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut() (+3 more)

### Community 12 - "dialog.tsx"
Cohesion: 0.13
Nodes (14): COLORS, MONTHS, StatsModalProps, Button(), buttonVariants, Dialog(), DialogContent(), DialogDescription() (+6 more)

### Community 13 - "components.json"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 14 - "recibo-preventa-print.tsx"
Cohesion: 0.13
Nodes (23): qrcode, qrcode, buildReceiptHtmlDocument(), downloadHtmlContentAsPdf(), FacturaPreventaTicket(), fechaArchivo(), forceSafeColors(), inlineHttpImagesAsDataUrls() (+15 more)

### Community 15 - "form.tsx"
Cohesion: 0.15
Nodes (15): react, react, ScaledDocument(), ScaledDocument(), FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue (+7 more)

### Community 16 - "DevicesAccordion.tsx"
Cohesion: 0.17
Nodes (11): authorizeDevice(), denyDevice(), supabaseAdmin, supabaseServiceKey, supabaseUrl, AuthorizeButton(), Device, DevicesAccordion() (+3 more)

### Community 17 - "formatMoney"
Cohesion: 0.16
Nodes (23): MovimientoCard(), MovimientoCardProps, AnularFactura(), AnularFacturaProps, CargarSaldoProps, CertificarFacturaProps, ComprobanteAnticipo(), ComprobanteAnticipoProps (+15 more)

### Community 19 - "dependencies"
Cohesion: 0.18
Nodes (11): browser-image-compression, class-variance-authority, next-themes, dependencies, browser-image-compression, class-variance-authority, next-themes, @simplewebauthn/browser (+3 more)

### Community 20 - "(settings)/hooks.ts"
Cohesion: 0.31
Nodes (7): getAppSettings(), updateAppSettings(), useAppSettings(), useUpdateAppSettings(), AppSettings(), appSettingsSchema, AppSettingsUpdate

### Community 21 - "export-reporte-pdf.ts"
Cohesion: 0.12
Nodes (27): AbonoCreditoRow, AbonoCreditoVentaSection, buildAbonosFilename(), buildReporteFilename(), DIAS_SEMANA, downloadPdfBlob(), drawAbonosVentaMeta(), drawBrandHeader() (+19 more)

### Community 22 - "weather/route.ts"
Cohesion: 0.35
Nodes (10): buildSummary(), DayWeather, fetchEnsembleMonth(), fillMonthGaps(), GET(), getGuatemalaToday(), mergeDays(), parseDailyWeather() (+2 more)

### Community 23 - "export-movimientos-pdf.ts"
Cohesion: 0.14
Nodes (20): buildFilename(), DIAS_SEMANA, downloadPdfBlob(), drawBrandHeader(), drawDocumentMeta(), exportMovimientosPreventaPdf(), formatFechaReporte(), getTableColumnStyles() (+12 more)

### Community 24 - "sheet.tsx"
Cohesion: 0.18
Nodes (6): SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 25 - "ImageUploader.tsx"
Cohesion: 0.20
Nodes (13): Area, createImage(), getCroppedFile(), getRadianAngle(), rotateSize(), ImageEditorModal(), ImageEditorModalProps, ImageUploader (+5 more)

### Community 26 - "dock.tsx"
Cohesion: 0.25
Nodes (8): Dock, DockContext, DockContextProps, DockIcon(), DockIconProps, DockProps, dockVariants, useDock()

### Community 27 - "monitor-view.tsx"
Cohesion: 0.70
Nodes (4): getGuatemalaDateParts(), getOrderDateString(), getWeeksLabels(), MonitorView()

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

### Community 45 - "ventas-view.tsx"
Cohesion: 0.13
Nodes (18): ClientRowActionsProps, MONTHS, MONTHS_SHORT, PeriodPickerProps, getGuatemalaDateParts(), getOrderDateString(), getWeeksLabels(), ListView() (+10 more)

### Community 48 - "SignUp.tsx"
Cohesion: 0.15
Nodes (12): ActionState, getAdminClient(), signup(), useSignupLogic(), AuthInput, authSchema, Input(), Label() (+4 more)

### Community 60 - "agregar-producto-preventa.tsx"
Cohesion: 0.36
Nodes (8): AgregarProductoPreventa(), AgregarProductoPreventaProps, listaEase, parseDecimal(), sanitizarDecimal(), snapCantidad(), PreventaDetalleValues, ProductoPreventa

### Community 64 - "preventas/lib/zod.ts"
Cohesion: 0.12
Nodes (20): Preventas(), useEliminarPreventaCliente(), useResumenPreventas(), ActualizarComprobantePreventaValues, addCalendarDays(), AnularFacturaPreventaValues, AplicarPreventaValues, ClienteLista (+12 more)

### Community 72 - "useUser"
Cohesion: 0.27
Nodes (8): UserContext, UserProvider(), useUser(), useUsers(), VerUsuarios(), PushNotificationToggle(), createClient(), urlBase64ToUint8Array()

### Community 75 - "PreventaCliente.tsx"
Cohesion: 0.16
Nodes (22): canUsePreventasSimular(), readLaAradaSimulatedRole(), AccionesCell(), DocumentoCell(), MovimientosTable(), MovimientosTableProps, useTablePagination(), EliminarConsumo() (+14 more)

### Community 76 - "ventas/index.tsx"
Cohesion: 0.17
Nodes (10): xlsx, ContabilidadView(), FEL_ONLY_ROLES, FULL_ACCESS_ROLES, getFileName(), StatCard(), ListadoVentas(), useVendedores() (+2 more)

### Community 77 - "AnimatedIcon.tsx"
Cohesion: 0.24
Nodes (6): AdminCards(), adminOptions, AnimatedThemeToggler(), AnimatedThemeTogglerProps, AnimatedIcon(), AnimatedIconProps

### Community 78 - "header.tsx"
Cohesion: 0.23
Nodes (8): AdminPanel(), Header(), LA_ARADA_LINKS, Menu(), MenuProps, getPendingDevicesCount(), writeLaAradaSimulatedRole(), BreadcrumbNav()

### Community 79 - "CargarSaldo.tsx"
Cohesion: 0.19
Nodes (18): CargarSaldo(), fechaDisplayToIso(), formatFechaInput(), isoToFechaDisplay(), listaEase, today(), CertificarFactura(), listaEase (+10 more)

### Community 80 - "cn"
Cohesion: 0.07
Nodes (37): Campo(), ComprobanteCell(), rowClass(), MONTHS, StatCard(), Stats(), YearlyDetailCard(), Avatar() (+29 more)

### Community 81 - "stats-accordion.tsx"
Cohesion: 0.40
Nodes (5): MONTHS, StatCard(), StatsAccordion(), YearlyDetailCard(), getProductStats()

### Community 86 - "utils.ts"
Cohesion: 0.09
Nodes (14): WELCOME_PHRASES, BotonSky(), BorderBeam(), BorderBeamProps, DotPattern(), DotPatternProps, Separator(), animationProps (+6 more)

### Community 90 - "layout.tsx"
Cohesion: 0.19
Nodes (9): geistMono, geistSans, metadata, RootLayout(), viewport, Providers(), ThemeProvider(), AuroraText (+1 more)

### Community 91 - "constancia-thumb.tsx"
Cohesion: 0.33
Nodes (7): ConstanciaThumb(), ConstanciaThumbProps, VerConstanciaModal(), VerConstanciaModalProps, getComprobanteSignedUrl(), loadStoragePreviewUrl(), normalizeStorageObjectPath()

### Community 95 - "table-pagination.tsx"
Cohesion: 0.40
Nodes (4): PAGE_SIZE_OPTIONS, PageSize, TablePagination(), TablePaginationProps

## Knowledge Gaps
- **313 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+308 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `LogIn.tsx`, `createClient`, `client-sales-modal.tsx`, `InfoUser.tsx`, `productos/lib/actions.ts`, `estadisticas/stats.tsx`, `detalle-credito-modal.tsx`, `dropdown-menu.tsx`, `dialog.tsx`, `recibo-preventa-print.tsx`, `form.tsx`, `DevicesAccordion.tsx`, `formatMoney`, `sheet.tsx`, `ImageUploader.tsx`, `dock.tsx`, `particles.tsx`, `ConnectivityShell.tsx`, `ventas-view.tsx`, `SignUp.tsx`, `badge.tsx`, `agregar-producto-preventa.tsx`, `preventas/lib/zod.ts`, `PreventaCliente.tsx`, `ventas/index.tsx`, `AnimatedIcon.tsx`, `header.tsx`, `CargarSaldo.tsx`, `stats-accordion.tsx`, `utils.ts`, `dashboard/index.tsx`, `constancia-thumb.tsx`, `table-pagination.tsx`?**
  _High betweenness centrality (0.335) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `recibo-preventa-print.tsx`, `form.tsx`, `@sweetalert2/theme-dark`, `jspdf`, `framer-motion`, `@hookform/resolvers`, `jspdf-autotable`, `lucide-react`, `motion`, `next`, `@radix-ui/react-avatar`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-popover`, `@radix-ui/react-select`, `web-push`, `react-easy-crop`, `react-hook-form`, `@supabase/supabase-js`, `react-toastify`, `recharts`, `@simplewebauthn/server`, `sweetalert2`, `clsx`, `tailwind-merge`, `file-saver`, `ventas/index.tsx`, `html2canvas`, `@radix-ui/react-separator`, `html-to-image`, `zod`, `@radix-ui/react-dropdown-menu`, `date-fns`, `@radix-ui/react-slot`, `@tanstack/react-query`, `react-dom`, `@react-pdf/renderer`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `LogIn.tsx`, `lib/infile.ts`, `preventas/lib/actions.ts`, `client-sales-modal.tsx`, `InfoUser.tsx`, `productos/lib/actions.ts`, `detalle-credito-modal.tsx`, `PreventaCliente.tsx`, `header.tsx`, `stats-accordion.tsx`, `(settings)/hooks.ts`, `layout.tsx`, `constancia-thumb.tsx`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _313 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LogIn.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09059233449477352 - nodes in this community are weakly interconnected._
- **Should `lib/infile.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07814207650273224 - nodes in this community are weakly interconnected._
- **Should `preventas/lib/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14126984126984127 - nodes in this community are weakly interconnected._