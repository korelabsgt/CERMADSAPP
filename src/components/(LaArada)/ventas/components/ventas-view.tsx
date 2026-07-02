import {
  Calendar,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  BarChart2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import StatsModal from "../modals/stats-modal";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTH_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const shiftMonth = (year: number, month: number, delta: number) => {
  let m = month + delta;
  let y = year;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return { year: y, month: m };
};

function MonthYearPicker({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);

  useEffect(() => {
    if (open) setViewYear(year);
  }, [open, year]);

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("es-GT", {
    month: "long",
  });
  const formatted = `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)} ${year}`;

  const goMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    onChange(next.year, next.month);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="flex items-center border rounded-lg bg-background h-10 overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="px-2.5 h-full hover:bg-muted border-r border-border transition-colors cursor-pointer"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </button>

          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 px-3 h-full font-bold text-xs hover:bg-muted transition-colors cursor-pointer min-w-[9.5rem] justify-center"
            >
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <span className="capitalize whitespace-nowrap">{formatted}</span>
              <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
            </button>
          </PopoverTrigger>

          <button
            type="button"
            onClick={() => goMonth(1)}
            className="px-2.5 h-full hover:bg-muted border-l border-border transition-colors cursor-pointer"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="center"
        sideOffset={6}
        className="w-64 p-3 z-[200] !bg-background border border-border shadow-xl"
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
            aria-label="Año anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="font-bold text-sm">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
            aria-label="Año siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {MONTH_SHORT.map((label, index) => {
            const monthValue = index + 1;
            const isSelected = viewYear === year && month === monthValue;

            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  onChange(viewYear, monthValue);
                  setOpen(false);
                }}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "hover:bg-muted text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const getGuatemalaDateParts = (dateInput?: string | Date) => {
  if (!dateInput || dateInput === "Sin Fecha")
    return getGuatemalaDateParts(new Date());

  let date = new Date(dateInput);
  if (typeof dateInput === "string" && dateInput.length === 10) {
    date = new Date(`${dateInput}T12:00:00`);
  }

  if (isNaN(date.getTime())) return getGuatemalaDateParts(new Date());

  const guatemalaTime = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Guatemala" }),
  );
  const year = guatemalaTime.getFullYear();
  const month = guatemalaTime.getMonth() + 1;
  const day = guatemalaTime.getDate();

  const firstDayJS = new Date(year, month - 1, 1).getDay();
  const firstDayIso = firstDayJS === 0 ? 6 : firstDayJS - 1;
  const week = Math.ceil((day + firstDayIso) / 7);

  return { year, month, week };
};

const getOrderDateString = (order: any) => {
  if (order.fecha_entrega) return String(order.fecha_entrega).substring(0, 10);
  if (order.created_at) return String(order.created_at).substring(0, 10);
  return "Sin Fecha";
};

const getWeeksLabels = (year: number, month: number) => {
  const labels = [];
  const lastDay = new Date(year, month, 0).getDate();
  const firstDayJS = new Date(year, month - 1, 1).getDay();
  const firstDayIso = firstDayJS === 0 ? 6 : firstDayJS - 1;
  const daysStr = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  let startDay = 1;
  while (startDay <= lastDay) {
    const weekNum = Math.ceil((startDay + firstDayIso) / 7);
    let endDay = startDay;
    while ((endDay + firstDayIso) % 7 !== 0 && endDay < lastDay) {
      endDay++;
    }
    const startJS = new Date(year, month - 1, startDay).getDay();
    const endJS = new Date(year, month - 1, endDay).getDay();
    labels.push({
      week: weekNum,
      label: `${daysStr[startJS === 0 ? 6 : startJS - 1]} ${startDay} - ${daysStr[endJS === 0 ? 6 : endJS - 1]} ${endDay}`,
    });
    startDay = endDay + 1;
  }
  return labels;
};

export default function ListView({
  items,
  orders,
  isLoading,
  formatDate,
  onStatusClick,
  onPrintClick,
  onEditClick,
}: any) {
  const data = useMemo(() => orders || items || [], [orders, items]);
  const current = useMemo(() => getGuatemalaDateParts(), []);

  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroMetodoPago, setFiltroMetodoPago] = useState<
    "" | "Efectivo" | "Transferencia"
  >("");
  const [filtroAnio, setFiltroAnio] = useState<number>(current.year);
  const [filtroMes, setFiltroMes] = useState<number>(current.month);
  const [filtroSemana, setFiltroSemana] = useState<number | "Todas">("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [showStats, setShowStats] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const semanasDelMes = useMemo(
    () => getWeeksLabels(filtroAnio, filtroMes),
    [filtroAnio, filtroMes],
  );

  const filteredItems = useMemo(() => {
    return data.filter((order: any) => {
      const estadoActual = String(order.estado || "Pendiente")
        .trim()
        .toLowerCase();
      const matchEstado =
        filtroEstado === "" || estadoActual === filtroEstado.toLowerCase();

      const metodoPagoActual = String(order.metodo_pago || "Efectivo").trim();
      const matchMetodoPago =
        filtroEstado.toLowerCase() !== "entregado" ||
        filtroMetodoPago === "" ||
        metodoPagoActual === filtroMetodoPago;

      const orderDate = getGuatemalaDateParts(getOrderDateString(order));
      const matchAnio = orderDate.year === filtroAnio;
      const matchMes = orderDate.month === filtroMes;
      const matchSemana =
        filtroSemana === "Todas" || orderDate.week === filtroSemana;

      const matchFecha = matchAnio && matchMes && matchSemana;

      let matchSearch = true;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const clienteNombre = (order.ven_clientes?.nombre || "").toLowerCase();
        const clienteNit = (order.ven_clientes?.nit || "").toLowerCase();
        const numRecibo = String(order.numero_recibo || "").toLowerCase();
        const shortId = String(order.id || "")
          .substring(0, 6)
          .toLowerCase();

        matchSearch =
          clienteNombre.includes(term) ||
          clienteNit.includes(term) ||
          numRecibo.includes(term) ||
          shortId.includes(term);
      }

      return (
        matchEstado &&
        matchMetodoPago &&
        matchSearch &&
        (estadoActual === "pendiente" || matchFecha)
      );
    });
  }, [data, filtroEstado, filtroMetodoPago, filtroAnio, filtroMes, filtroSemana, searchTerm]);

  const counts = useMemo(() => {
    const c = { Pendiente: 0, Entregado: 0, Anulado: 0 };
    data.forEach((order: any) => {
      const estado = String(order.estado || "Pendiente")
        .trim()
        .toLowerCase();
      const orderDate = getGuatemalaDateParts(getOrderDateString(order));
      const matchFecha =
        orderDate.year === filtroAnio &&
        orderDate.month === filtroMes &&
        (filtroSemana === "Todas" || orderDate.week === filtroSemana);

      if (estado === "pendiente" || matchFecha) {
        if (estado === "pendiente") c.Pendiente++;
        else if (estado === "entregado") c.Entregado++;
        else if (estado === "anulado") c.Anulado++;
      }
    });
    return c;
  }, [data, filtroAnio, filtroMes, filtroSemana]);

  useEffect(() => {
    if (
      filtroEstado !== "" &&
      counts[filtroEstado as keyof typeof counts] === 0
    ) {
      setFiltroEstado("");
    }
  }, [counts, filtroEstado]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filtroEstado,
    filtroMetodoPago,
    filtroAnio,
    filtroMes,
    filtroSemana,
    itemsPerPage,
    searchTerm,
  ]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const groupedOrders = useMemo(() => {
    const groups: Record<string, any[]> = {};
    paginatedItems.forEach((order: any) => {
      const date = getOrderDateString(order);
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
    });

    return Object.keys(groups)
      .sort((a, b) => {
        if (a === "Sin Fecha") return 1;
        if (b === "Sin Fecha") return -1;
        return new Date(b).getTime() - new Date(a).getTime();
      })
      .map((date) => ({
        date,
        orders: groups[date],
      }));
  }, [paginatedItems]);

  const handleMonthYearChange = (year: number, month: number) => {
    setFiltroAnio(year);
    setFiltroMes(month);
    setFiltroSemana("Todas");
  };

  const pagoOpciones = [
    { v: "Efectivo" as const, label: "Efectivo", c: "purple" },
    { v: "Transferencia" as const, label: "Transferencia", c: "blue" },
  ];

  const filterChipClass = (color: string, selected: boolean) =>
    cn(
      "flex items-center justify-center border-2 rounded-xl cursor-pointer transition-all font-semibold px-4 py-2 min-h-9 text-xs sm:text-sm shrink-0 whitespace-nowrap",
      `bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`,
      `border-${color}-500/40`,
      selected
        ? `border-${color}-500 opacity-100 shadow-sm`
        : "opacity-65 hover:opacity-100",
    );

  const renderFiltrosVenta = () => {
    const chips: React.ReactNode[] = [];

    const toggleEstado = (estado: "Pendiente" | "Entregado" | "Anulado") => {
      if (filtroEstado === estado && filtroMetodoPago === "") {
        setFiltroEstado("");
      } else {
        setFiltroEstado(estado);
        setFiltroMetodoPago("");
      }
    };

    chips.push(
      <button
        key="estado-Pendiente"
        type="button"
        onClick={() => toggleEstado("Pendiente")}
        className={filterChipClass(
          "amber",
          filtroEstado === "Pendiente" && filtroMetodoPago === "",
        )}
      >
        Pendiente ({counts.Pendiente})
      </button>,
    );

    chips.push(
      <button
        key="estado-Entregado"
        type="button"
        onClick={() => toggleEstado("Entregado")}
        className={filterChipClass(
          "green",
          filtroEstado === "Entregado" && filtroMetodoPago === "",
        )}
      >
        Entregado ({counts.Entregado})
      </button>,
    );

    for (const pago of pagoOpciones) {
      chips.push(
        <button
          key={`pago-${pago.v}`}
          type="button"
          onClick={() => {
            if (
              filtroEstado === "Entregado" &&
              filtroMetodoPago === pago.v
            ) {
              setFiltroEstado("");
              setFiltroMetodoPago("");
            } else {
              setFiltroEstado("Entregado");
              setFiltroMetodoPago(pago.v);
            }
          }}
          className={filterChipClass(
            pago.c,
            filtroEstado === "Entregado" && filtroMetodoPago === pago.v,
          )}
        >
          {pago.label}
        </button>,
      );
    }

    chips.push(
      <button
        key="estado-Anulado"
        type="button"
        onClick={() => toggleEstado("Anulado")}
        className={filterChipClass(
          "red",
          filtroEstado === "Anulado" && filtroMetodoPago === "",
        )}
      >
        Anulado ({counts.Anulado})
      </button>,
    );

    return (
      <div className="flex flex-nowrap items-center gap-3 sm:gap-4 w-full min-w-0">
        <span className="w-[4.5rem] sm:w-20 shrink-0 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
          Estado:
        </span>
        <div className="flex flex-nowrap gap-2.5 sm:gap-3 items-center min-w-0 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips}
        </div>
      </div>
    );
  };

  if (isLoading && data.length === 0)
    return (
      <div className="p-8 text-center border rounded-xl bg-card italic">
        Cargando...
      </div>
    );

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Top filter bar */}
      <div className="flex flex-col gap-3 p-4 bg-card border rounded-xl shadow-sm">
        {/* Fila 1: búsqueda + fecha + acciones */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between w-full">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 w-full sm:max-w-xs lg:max-w-sm focus-within:ring-2 focus-within:ring-orange-500/20 transition-all h-10 shrink-0">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Buscar por Cliente, recibo o NIT"
              className="bg-transparent outline-none text-xs w-full font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-row gap-2 w-full sm:w-auto items-center shrink-0">
            <MonthYearPicker
              year={filtroAnio}
              month={filtroMes}
              onChange={handleMonthYearChange}
            />

            <select
              value={filtroSemana}
              onChange={(e) =>
                setFiltroSemana(
                  e.target.value === "Todas"
                    ? "Todas"
                    : Number(e.target.value),
                )
              }
              className="flex-1 sm:flex-none h-10 px-2 sm:px-3 border rounded-lg bg-background font-bold text-[10px] sm:text-xs outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer truncate min-w-24"
            >
              <option value="Todas">Semana</option>
              {semanasDelMes.map((s) => (
                <option key={s.week} value={s.week}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowStats(true)}
              className="h-10 flex items-center justify-center gap-2 px-4 border rounded-lg bg-orange-500/10 text-orange-600 font-bold text-xs hover:bg-orange-500/20 transition-all cursor-pointer whitespace-nowrap border-orange-500/30 shrink-0"
            >
              <BarChart2 className="size-4" />
              <span className="hidden sm:inline">Ventas por Vendedor</span>
              <span className="sm:hidden">Vendedor</span>
            </button>
          </div>
        </div>

        {/* Fila 2: estado · Fila 3: tipo de pago */}
        <div className="rounded-lg bg-muted/25 border border-border/40 p-3 sm:px-4 sm:py-3">
          {renderFiltrosVenta()}
        </div>
      </div>

      {/* Results */}
      <div className="w-full flex flex-col gap-3">
        {groupedOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card font-bold uppercase">
            Sin pedidos registrados
          </div>
        ) : (
          groupedOrders.map((group) => {
            const rawDate =
              group.date !== "Sin Fecha"
                ? new Date(`${group.date}T12:00:00`).toLocaleDateString(
                    "es-GT",
                    { weekday: "long", day: "2-digit", month: "long" },
                  )
                : "Sin Fecha de Entrega";
            const formattedDate =
              group.date !== "Sin Fecha"
                ? rawDate.charAt(0).toUpperCase() +
                  rawDate.slice(1).replace(".", "")
                : rawDate;

            return (
              <div key={group.date} className="flex flex-col gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full flex items-center gap-2 border border-primary/20">
                    <Calendar className="size-4" />
                    <span className="font-black uppercase text-sm tracking-wider">
                      {formattedDate}
                    </span>
                  </div>
                  <div className="h-0.5 grow bg-border/50"></div>
                </div>

                <div className="flex flex-col gap-3">
                  {group.orders.map((venta: any) => {
                    const estadoNormal = String(venta.estado || "Pendiente")
                      .trim()
                      .toLowerCase();
                    const tieneFacturaCertificada = venta.dte_documentos?.some(
                      (d: any) => d.estado === "certificado",
                    );
                    const isEntregada = estadoNormal === "entregado";
                    const isAnulada = estadoNormal === "anulado";

                    let borderColor = "border-border";
                    let textColor = "text-amber-500";
                    if (isAnulada) {
                      borderColor = "border-red-400/50 ring-1 ring-red-400/5";
                      textColor = "text-red-600 dark:text-red-500";
                    } else if (isEntregada) {
                      if (tieneFacturaCertificada) {
                        borderColor =
                          "border-sky-400/50 ring-1 ring-sky-400/10";
                        textColor = "text-sky-600 dark:text-sky-500";
                      } else {
                        borderColor =
                          "border-emerald-400/50 ring-1 ring-emerald-400/10";
                        textColor = "text-emerald-600 dark:text-emerald-500";
                      }
                    }

                    const handleEditAreaClick = () => {
                      onEditClick(venta);
                    };

                    return (
                      <div
                        key={venta.id}
                        className={`bg-card border rounded-xl flex flex-col md:flex-row overflow-hidden relative shadow-sm transition-all ${borderColor}`}
                      >
                        <div
                          onClick={handleEditAreaClick}
                          className={`grow flex flex-col md:flex-row transition-all p-4 rounded-t-xl md:rounded-l-xl md:rounded-tr-none cursor-pointer ${
                            tieneFacturaCertificada && !isAnulada
                              ? "opacity-90"
                              : "hover:ring-inset hover:ring-2 hover:ring-primary/40"
                          }`}
                        >
                          <div className="flex pr-5 flex-col gap-1 w-full md:w-112.5 shrink-0">
                            <span
                              className={`font-mono font-bold ${textColor} text-sm`}
                            >
                              Venta #
                              {venta.id
                                ? `${venta.id.substring(0, 3).toUpperCase()}-${venta.id.substring(3, 6).toUpperCase()}`
                                : "---"}
                              <span className="px-2 ml-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-muted text-muted-foreground">
                                {venta.tipo_venta}
                              </span>
                              {tieneFacturaCertificada && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                                  DTE ✓
                                </span>
                              )}
                            </span>

                            <h3 className="font-bold text-foreground text-base uppercase mt-1">
                              {venta.ven_clientes?.nombre}
                            </h3>

                            {venta.ven_detalle &&
                              venta.ven_detalle.length > 0 && (
                                <div className="flex flex-col gap-1 my-2 py-2 border-y border-border/50">
                                  {venta.ven_detalle.map((det: any) => (
                                    <div
                                      key={det.id}
                                      className="flex justify-between items-center text-xs text-muted-foreground"
                                    >
                                      <span className="truncate pr-2">
                                        {det.cantidad}{" "}
                                        {det.inv_productos?.medida || ""}
                                        {" de "}
                                        {det.inv_productos?.nombre ||
                                          "Producto"}
                                      </span>
                                      <span className="font-mono font-bold">
                                        Q{Number(det.subtotal || 0).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-baseline gap-1">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Total:
                                </span>
                                <span className="font-mono font-bold text-lg text-foreground leading-none">
                                  Q{venta.total?.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col flex-1 justify-between md:pl-4 md:border-l border-border/50 min-h-25 mt-4 md:mt-0">
                            <div className="flex flex-col gap-1">
                              {venta.observaciones && (
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase font-bold text-blue-600">
                                    Observaciones:
                                  </span>
                                  <span className="text-xs italic text-foreground/90 leading-tight mt-0.5">
                                    {venta.observaciones}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 border-t border-border/30 pt-2">
                              <span className="text-[10px] uppercase font-bold text-blue-600">
                                Vendedor:
                              </span>
                              <span className="text-xs font-semibold text-muted-foreground">
                                {venta.vendedor?.nombre || "-"}
                              </span>
                              <span className="text-[10px] italic text-muted-foreground mt-0.5">
                                {venta.created_at
                                  ? new Date(
                                      venta.created_at,
                                    ).toLocaleTimeString("es-GT", {
                                      timeZone: "America/Guatemala",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                    })
                                  : "--:--"}{" "}
                                hrs
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row items-stretch justify-end border-t md:border-t-0 md:border-l border-border bg-card">
                          {estadoNormal !== "anulado" && (
                            <button
                              id={`print-btn-${venta.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onPrintClick(venta.id);
                              }}
                              className="w-1/2 md:w-20 shrink-0 py-5 md:py-0 flex items-center justify-center transition-all bg-transparent border-r border-border/50 hover:ring-inset hover:ring-2 hover:ring-blue-500/40 cursor-pointer"
                            >
                              <div className="flex items-center justify-center text-blue-600 dark:text-blue-500">
                                <AnimatedIcon
                                  iconKey="qjtwiolr"
                                  target={`#print-btn-${venta.id}`}
                                  className="w-8 h-8 md:w-10 md:h-10"
                                />
                              </div>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (estadoNormal === "pendiente")
                                onStatusClick(venta);
                            }}
                            disabled={estadoNormal !== "pendiente"}
                            className={`${
                              estadoNormal !== "anulado" ? "w-1/2" : "w-full"
                            } md:w-40 shrink-0 py-5 md:py-0 flex items-center justify-center gap-1.5 text-xs uppercase font-bold transition-all ${
                              estadoNormal === "pendiente"
                                ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 cursor-pointer"
                                : estadoNormal === "entregado"
                                  ? tieneFacturaCertificada
                                    ? "bg-sky-500/10 text-sky-600 opacity-90 cursor-default"
                                    : "bg-green-500/10 text-green-600 opacity-90 cursor-default"
                                  : "bg-red-500/10 text-red-600 opacity-80 cursor-default"
                            }`}
                          >
                            {venta.estado || "Pendiente"}{" "}
                            <Edit className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {filteredItems.length > 0 && (
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end mt-4">
            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-background border rounded-lg px-2 py-1.5 text-xs font-bold outline-none cursor-pointer h-9"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={100}>Todos</option>
              </select>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                {currentPage} / {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 md:p-2 border rounded-md hover:bg-muted disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 md:p-2 border rounded-md hover:bg-muted disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        allVentas={data}
      />
    </div>
  );
}
