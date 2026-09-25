"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, DollarSign, Package, Users } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  LineChart,
} from "recharts";
import { useMemo } from "react";
import { fechaConteoVenta } from "@/components/(LaArada)/lib/fecha-venta";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allVentas: any[];
}

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#8b5cf6",
  "#ec4899", "#facc15", "#06b6d4", "#ef4444",
];

export default function StatsModal({ isOpen, onClose, allVentas }: StatsModalProps) {

  // Build per-seller per-month data
  const { sellers, chartData, totals } = useMemo(() => {
    // Collect unique sellers
    const sellerMap: Record<string, { id: string; name: string }> = {};
    allVentas
      .filter((v) => v.estado?.toLowerCase() !== "anulado")
      .forEach((v) => {
        const id = v.usuario_id || "unknown";
        const name = v.vendedor?.nombre || "Sin Vendedor";
        if (!sellerMap[id]) sellerMap[id] = { id, name };
      });

    const sellers = Object.values(sellerMap);

    // Monthly totals per seller
    const monthly: Record<string, Record<number, number>> = {};
    sellers.forEach((s) => { monthly[s.id] = {}; for(let i=0;i<12;i++) monthly[s.id][i]=0; });

    allVentas
      .filter((v) => v.estado?.toLowerCase() !== "anulado")
      .forEach((v) => {
        const id = v.usuario_id || "unknown";
        if (!monthly[id]) return;
        const date = fechaConteoVenta(v);
        if (!date) return;
        monthly[id][date.getMonth()] += v.total || 0;
      });

    // Build chart data: [{name: "Ene", "Juan": 1200, "Pedro": 900}, ...]
    const chartData = MONTHS.map((name, i) => {
      const point: Record<string, any> = { name };
      sellers.forEach((s) => {
        point[s.name] = parseFloat((monthly[s.id][i] || 0).toFixed(2));
      });
      return point;
    });

    // Total per seller
    const totals: Record<string, number> = {};
    sellers.forEach((s) => {
      totals[s.name] = Object.values(monthly[s.id]).reduce((a, b) => a + b, 0);
    });

    // Sort sellers by total descending
    sellers.sort((a, b) => (totals[b.name] || 0) - (totals[a.name] || 0));

    return { sellers, chartData, totals };
  }, [allVentas]);

  const totalGlobal = Object.values(totals).reduce((a, b) => a + b, 0);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[1400px] w-[95vw] sm:max-w-[95vw] max-h-[96vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase italic tracking-tighter">
            <Users className="size-6 text-orange-500" />
            Comparativo de Ventas por Vendedor
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 bg-muted/20 border rounded-3xl p-6 h-[400px] sm:h-[480px]">
          <h4 className="text-xs font-black uppercase text-muted-foreground mb-4 flex items-center gap-2">
            <div className="size-2 bg-orange-500 rounded-full animate-pulse" />
            Ventas Mensuales por Vendedor — Gráfica de Puntos
          </h4>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: "bold" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: "bold" }}
                tickFormatter={(val) => `Q${val >= 1000 ? (val/1000).toFixed(1)+"k" : val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
                formatter={(val: any, name?: string) => [
                  `Q${Number(val || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`,
                  name ?? "",
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "12px" }}
              />
              {sellers.map((s, i) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 5, fill: COLORS[i % COLORS.length], strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* List representation of totals */}
        <div className="mt-6 flex flex-col gap-2">
          <h4 className="text-xs font-black uppercase text-muted-foreground mb-2">Desglose de Ventas por Vendedor</h4>
          
          <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/40">
             <div className="flex items-center gap-3">
               <DollarSign className="size-5 text-orange-600" />
               <span className="text-sm font-black uppercase text-orange-600 tracking-wider">Total Global</span>
             </div>
             <span className="text-xl font-black text-orange-700 dark:text-orange-400">
               Q{totalGlobal.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
             </span>
          </div>

          {sellers.map((s, i) => (
            <div 
              key={s.id} 
              className="flex items-center justify-between p-4 rounded-xl border"
              style={{ borderColor: COLORS[i % COLORS.length] + "40", background: COLORS[i % COLORS.length] + "10" }}
            >
              <div className="flex items-center gap-3">
                <div className="size-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-sm font-black uppercase tracking-wider" style={{ color: COLORS[i % COLORS.length] }}>
                  {s.name}
                </span>
              </div>
               <span className="text-lg font-black" style={{ color: COLORS[i % COLORS.length] }}>
                 Q{(totals[s.name] || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
               </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-foreground text-background rounded-full font-black text-xs uppercase hover:opacity-80 transition active:scale-95 cursor-pointer"
          >
            Cerrar Panel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
