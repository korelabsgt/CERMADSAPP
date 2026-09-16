# Graph Report - cermadsapp  (2026-09-16)

## Corpus Check
- 242 files · ~137,200 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1383 nodes · 3292 edges · 105 communities (61 shown, 44 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3018649f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- gastos/index.tsx
- lib/infile.ts
- preventas/lib/actions.ts
- ventas/lib/actions.ts
- client-sales-modal.tsx
- InfoUser.tsx
- productos/lib/actions.ts
- devDependencies
- estadisticas/stats.tsx
- creditos/index.tsx
- compilerOptions
- dropdown-menu.tsx
- dialog.tsx
- components.json
- recibo-preventa-print.tsx
- form.tsx
- DevicesAccordion.tsx
- detalle-credito-modal.tsx
- @sweetalert2/theme-dark
- dependencies
- (settings)/hooks.ts
- export-reporte-pdf.ts
- weather/route.ts
- export-movimientos-pdf.ts
- createClient
- cropImage.ts
- dock.tsx
- usuarios/lib/actions.ts
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
- select.tsx
- motion
- creditos-list.tsx
- next.config.ts
- ventas-view.tsx
- @radix-ui/react-avatar
- @radix-ui/react-dialog
- LogIn.tsx
- @radix-ui/react-label
- @radix-ui/react-popover
- @radix-ui/react-select
- table.tsx
- web-push
- react-easy-crop
- react-hook-form
- @supabase/supabase-js
- react-toastify
- useUser
- @simplewebauthn/server
- agregar-producto-preventa.tsx
- sweetalert2
- components/stats.tsx
- tailwind-merge
- preventas/lib/zod.ts
- file-saver
- postcss.config.mjs
- health/route.ts
- border-beam.tsx
- global.d.ts
- utils.ts
- contabilidad/index.tsx
- AnimatedIcon.tsx
- dashboard.tsx
- CargarSaldo.tsx
- cn
- stats-accordion.tsx
- shiny-button.tsx
- @radix-ui/react-separator
- typing-animation.tsx
- zod
- badge.tsx
- @radix-ui/react-dropdown-menu
- class-variance-authority
- clsx
- app/layout.tsx
- constancia-thumb.tsx
- @radix-ui/react-slot
- @tanstack/react-query
- react-dom
- table-pagination.tsx
- next-themes
- @simplewebauthn/browser
- @supabase/ssr
- html2canvas
- lucide
- morphicons
- @react-pdf/renderer
- recharts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 216 edges
2. `createClient()` - 102 edges
3. `useUser()` - 44 edges
4. `formatMoney()` - 26 edges
5. `DetalleCreditoModal()` - 23 edges
6. `createClient()` - 22 edges
7. `readLaAradaSimulatedRole()` - 20 edges
8. `PreventaCliente()` - 20 edges
9. `requireAuthenticatedCajero()` - 19 edges
10. `Supabase` - 18 edges

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

## Communities (105 total, 44 thin omitted)

### Community 0 - "gastos/index.tsx"
Cohesion: 0.10
Nodes (40): BalanceComparativo(), BalanceComparativoProps, DIAS_SEMANA, formatMoney(), ALLOWED_ROLES, Estadisticas(), Gastos(), createGasto() (+32 more)

### Community 1 - "lib/infile.ts"
Cohesion: 0.07
Nodes (62): POST(), POST(), anularFacturaPreventa(), escapeXml(), getVentaById(), printHtmlContent(), RECEIPT_DOC_W_PX, ReceiptModal() (+54 more)

### Community 2 - "preventas/lib/actions.ts"
Cohesion: 0.14
Nodes (35): aplicarPreventa(), buildItemsDTE(), certificarFacturaPreventa(), certificarPreventaExistente(), computeSaldo(), crearPreventa(), devolverPreventaPorVenta(), editarCargaPreventa() (+27 more)

### Community 3 - "ventas/lib/actions.ts"
Cohesion: 0.06
Nodes (66): ImageUploader, ImageUploaderHandle, ImageUploaderProps, showImageError(), showUploadError(), swalTheme(), useUsers(), VerUsuarios() (+58 more)

### Community 4 - "client-sales-modal.tsx"
Cohesion: 0.07
Nodes (54): ListadoClientes(), createClientAction(), deleteClientAction(), getClientDeletionPreview(), getClientSalesAction(), isVentaAnulada(), mapDeleteClientError(), requireDeletePermission() (+46 more)

### Community 5 - "InfoUser.tsx"
Cohesion: 0.13
Nodes (25): InfoPerfil(), InfoPerfilProps, Input(), Label(), Select(), InfoUser(), InfoUserProps, StatusSwitch() (+17 more)

### Community 6 - "productos/lib/actions.ts"
Cohesion: 0.11
Nodes (25): PageSizeOption, TablePagination(), TablePaginationProps, ListadoProductos(), ProductoCatalogo, createProduct(), deleteProduct(), getAllProductsStats() (+17 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (35): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+27 more)

### Community 8 - "estadisticas/stats.tsx"
Cohesion: 0.06
Nodes (36): ClientesSkeleton(), CreditosSkeleton(), EstadisticasDataSkeleton(), EstadisticasPageSkeleton(), PeriodPicker(), toPeriodKey(), CHART_COLORS, CHART_TABS (+28 more)

### Community 9 - "creditos/index.tsx"
Cohesion: 0.12
Nodes (27): ReciboAbonoPrint(), DetalleCreditoCliente(), Creditos(), DIAS_SEMANA, formatDateShort(), formatFelNumero(), formatMoney(), getFelCertificado() (+19 more)

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

### Community 17 - "detalle-credito-modal.tsx"
Cohesion: 0.12
Nodes (29): DteDocumentoCredito, PagoCreditoHistorial, DetalleCreditoModal(), DIAS_SEMANA, esParticulaNombre(), FelInfoPanel(), FILTRO_ABONOS_OPTIONS, FILTRO_ESTADO_REPORTE_OPTIONS (+21 more)

### Community 19 - "dependencies"
Cohesion: 0.18
Nodes (11): browser-image-compression, date-fns, html-to-image, lucide-react, next, dependencies, browser-image-compression, date-fns (+3 more)

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

### Community 24 - "createClient"
Cohesion: 0.18
Nodes (15): logout(), POST(), DELETE(), POST(), LaAradaPage(), checkDeviceRequest(), createDeviceRequest(), notifyAdminsOfArrival() (+7 more)

### Community 25 - "cropImage.ts"
Cohesion: 0.42
Nodes (7): Area, createImage(), getCroppedFile(), getRadianAngle(), rotateSize(), ImageEditorModal(), ImageEditorModalProps

### Community 26 - "dock.tsx"
Cohesion: 0.25
Nodes (8): Dock, DockContext, DockContextProps, DockIcon(), DockIconProps, DockProps, dockVariants, useDock()

### Community 27 - "usuarios/lib/actions.ts"
Cohesion: 0.22
Nodes (10): getAdminClient(), getProfileById(), getUserUsername(), toggleUserStatus(), updateProfile(), updateUserCredentials(), baseFields, ProfileFormValues (+2 more)

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

### Community 41 - "select.tsx"
Cohesion: 0.18
Nodes (7): SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger()

### Community 43 - "creditos-list.tsx"
Cohesion: 0.38
Nodes (7): CreditosList(), CreditosListProps, formatDeuda(), findClienteBySlug(), getClienteSlug(), toClienteSlug(), ClienteCredito

### Community 45 - "ventas-view.tsx"
Cohesion: 0.13
Nodes (18): ClientRowActionsProps, MONTHS, MONTHS_SHORT, PeriodPickerProps, getGuatemalaDateParts(), getOrderDateString(), getWeeksLabels(), ListView() (+10 more)

### Community 48 - "LogIn.tsx"
Cohesion: 0.05
Nodes (43): ActionState, getPublicAppSettings(), login(), LogIn(), PasskeyPrompt(), getPasskeyOptions(), getPasskeys(), getPasskeysCount() (+35 more)

### Community 52 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table(), TableBody(), TableCaption(), TableCell(), TableFooter(), TableHead(), TableHeader(), TableRow()

### Community 58 - "useUser"
Cohesion: 0.25
Nodes (8): DashboardPage(), Dashboard(), Header(), UserContext, useUser(), BreadcrumbNav(), PushNotificationToggle(), urlBase64ToUint8Array()

### Community 60 - "agregar-producto-preventa.tsx"
Cohesion: 0.36
Nodes (8): AgregarProductoPreventa(), AgregarProductoPreventaProps, listaEase, parseDecimal(), sanitizarDecimal(), snapCantidad(), PreventaDetalleValues, ProductoPreventa

### Community 62 - "components/stats.tsx"
Cohesion: 0.40
Nodes (4): MONTHS, StatCard(), Stats(), YearlyDetailCard()

### Community 64 - "preventas/lib/zod.ts"
Cohesion: 0.10
Nodes (25): Preventas(), actualizarComprobantePreventa(), getMovimientosCliente(), mapPreventaDte(), useActualizarComprobantePreventa(), useAnularFacturaPreventa(), useEliminarMovimientoPreventa(), useEliminarPreventaCliente() (+17 more)

### Community 75 - "utils.ts"
Cohesion: 0.15
Nodes (36): MovimientoCard(), MovimientoCardProps, AccionesCell(), DocumentoCell(), MovimientosTable(), MovimientosTableProps, useTablePagination(), AnularFactura() (+28 more)

### Community 76 - "contabilidad/index.tsx"
Cohesion: 0.15
Nodes (14): xlsx, LA_ARADA_LINKS, Menu(), MenuProps, ContabilidadSkeleton(), ContabilidadView(), FEL_ONLY_ROLES, FULL_ACCESS_ROLES (+6 more)

### Community 77 - "AnimatedIcon.tsx"
Cohesion: 0.23
Nodes (7): AdminCards(), adminOptions, AnimatedThemeToggler(), AnimatedThemeTogglerProps, AnimatedIcon(), AnimatedIconProps, waitForLordIcon()

### Community 78 - "dashboard.tsx"
Cohesion: 0.25
Nodes (12): getClients(), getVentasCredito(), DashboardLaArada(), DashboardSkeleton(), WELCOME_PHRASES, LaAradaSidebar(), NavItem, readLaAradaSimulatedRole() (+4 more)

### Community 79 - "CargarSaldo.tsx"
Cohesion: 0.18
Nodes (19): CargarSaldo(), fechaDisplayToIso(), formatFechaInput(), isoToFechaDisplay(), listaEase, today(), CertificarFactura(), listaEase (+11 more)

### Community 80 - "cn"
Cohesion: 0.08
Nodes (29): BotonSky(), Campo(), ComprobanteCell(), Row(), WizardHeader(), Avatar(), AvatarBadge(), AvatarFallback() (+21 more)

### Community 81 - "stats-accordion.tsx"
Cohesion: 0.40
Nodes (5): MONTHS, StatCard(), StatsAccordion(), YearlyDetailCard(), getProductStats()

### Community 82 - "shiny-button.tsx"
Cohesion: 0.50
Nodes (3): animationProps, ShinyButton, ShinyButtonProps

### Community 90 - "app/layout.tsx"
Cohesion: 0.22
Nodes (8): geistMono, geistSans, metadata, RootLayout(), viewport, Providers(), UserProvider(), ThemeProvider()

### Community 91 - "constancia-thumb.tsx"
Cohesion: 0.33
Nodes (7): ConstanciaThumb(), ConstanciaThumbProps, VerConstanciaModal(), VerConstanciaModalProps, getComprobanteSignedUrl(), loadStoragePreviewUrl(), normalizeStorageObjectPath()

### Community 95 - "table-pagination.tsx"
Cohesion: 0.40
Nodes (4): PAGE_SIZE_OPTIONS, PageSize, TablePagination(), TablePaginationProps

## Knowledge Gaps
- **320 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+315 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `gastos/index.tsx`, `ventas/lib/actions.ts`, `client-sales-modal.tsx`, `InfoUser.tsx`, `productos/lib/actions.ts`, `estadisticas/stats.tsx`, `creditos/index.tsx`, `dropdown-menu.tsx`, `dialog.tsx`, `recibo-preventa-print.tsx`, `form.tsx`, `DevicesAccordion.tsx`, `detalle-credito-modal.tsx`, `dock.tsx`, `particles.tsx`, `ConnectivityShell.tsx`, `select.tsx`, `ventas-view.tsx`, `LogIn.tsx`, `table.tsx`, `useUser`, `agregar-producto-preventa.tsx`, `components/stats.tsx`, `preventas/lib/zod.ts`, `border-beam.tsx`, `utils.ts`, `contabilidad/index.tsx`, `AnimatedIcon.tsx`, `dashboard.tsx`, `CargarSaldo.tsx`, `stats-accordion.tsx`, `shiny-button.tsx`, `typing-animation.tsx`, `badge.tsx`, `constancia-thumb.tsx`, `table-pagination.tsx`?**
  _High betweenness centrality (0.359) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `recibo-preventa-print.tsx`, `form.tsx`, `@sweetalert2/theme-dark`, `jspdf`, `framer-motion`, `@hookform/resolvers`, `jspdf-autotable`, `motion`, `@radix-ui/react-avatar`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-popover`, `@radix-ui/react-select`, `web-push`, `react-easy-crop`, `react-hook-form`, `@supabase/supabase-js`, `react-toastify`, `@simplewebauthn/server`, `sweetalert2`, `tailwind-merge`, `file-saver`, `contabilidad/index.tsx`, `@radix-ui/react-separator`, `zod`, `@radix-ui/react-dropdown-menu`, `class-variance-authority`, `clsx`, `@radix-ui/react-slot`, `@tanstack/react-query`, `react-dom`, `next-themes`, `@simplewebauthn/browser`, `@supabase/ssr`, `html2canvas`, `lucide`, `morphicons`, `@react-pdf/renderer`, `recharts`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `gastos/index.tsx`, `preventas/lib/zod.ts`, `preventas/lib/actions.ts`, `lib/infile.ts`, `client-sales-modal.tsx`, `InfoUser.tsx`, `app/layout.tsx`, `ventas/lib/actions.ts`, `productos/lib/actions.ts`, `creditos/index.tsx`, `constancia-thumb.tsx`, `dashboard.tsx`, `LogIn.tsx`, `stats-accordion.tsx`, `(settings)/hooks.ts`, `useUser`, `usuarios/lib/actions.ts`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _320 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `gastos/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09783368273934312 - nodes in this community are weakly interconnected._
- **Should `lib/infile.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07204968944099378 - nodes in this community are weakly interconnected._
- **Should `preventas/lib/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13813813813813813 - nodes in this community are weakly interconnected._