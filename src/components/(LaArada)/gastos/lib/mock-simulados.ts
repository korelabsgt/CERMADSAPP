import { GastoItem } from "./zod";

export const MOCK_GASTOS_SIMULADOS: GastoItem[] = [
  {
    id: "simulado-gasto-1",
    nombre: "Pago de Planilla Quincenal (Operarios de Planta)",
    cantidad: 14500.0,
    categoria: "Planilla",
    descripcion: "Pago quincenal correspondiente al personal de beneficio y empaque",
    fecha: "2026-09-12T14:00:00.000Z",
    created_at: "2026-09-11T14:00:00.000Z",
    created_by: "Carlos Mendoza",
    movimientos: [
      {
        id: "mov-1-2",
        fecha: "2026-09-12T16:30:00.000Z",
        usuario: "Ana Morales",
        accion: "Edición",
        detalle:
          'Editado por Ana Morales: Monto: antes Q13,800.00 ➔ ahora Q14,500.00 | Descripción: antes "Pago quincenal estimado" ➔ ahora "Pago quincenal correspondiente al personal de beneficio y empaque"',
      },
      {
        id: "mov-1-1",
        fecha: "2026-09-11T14:00:00.000Z",
        usuario: "Carlos Mendoza",
        accion: "Creación",
        detalle:
          'Creado por Carlos Mendoza: Monto inicial Q13,800.00, Categoría "Planilla", Concepto "Pago de Planilla Quincenal", Descripción: "Pago quincenal estimado"',
      },
    ],
  },
  {
    id: "simulado-gasto-2",
    nombre: "Combustible Diesel Camión Distribución Hino 500",
    cantidad: 2850.5,
    categoria: "Compras",
    descripcion: "Diesel para camión de entregas ruta Esquipulas - Chiquimula",
    fecha: "2026-09-10T15:45:00.000Z",
    created_at: "2026-09-10T15:45:00.000Z",
    created_by: "Juan Pérez",
    movimientos: [
      {
        id: "mov-2-2",
        fecha: "2026-09-10T18:20:00.000Z",
        usuario: "Juan Pérez",
        accion: "Edición",
        detalle:
          'Editado por Juan Pérez: Concepto: antes "Combustible camión" ➔ ahora "Combustible Diesel Camión Distribución Hino 500" | Monto: antes Q2,500.00 ➔ ahora Q2,850.50',
      },
      {
        id: "mov-2-1",
        fecha: "2026-09-10T15:45:00.000Z",
        usuario: "Juan Pérez",
        accion: "Creación",
        detalle:
          'Creado por Juan Pérez: Monto Q2,500.00, Categoría "Compras", Concepto "Combustible camión"',
      },
    ],
  },
  {
    id: "simulado-gasto-3",
    nombre: "Mantenimiento Preventivo de Molino y Selección",
    cantidad: 3600.0,
    categoria: "Mantenimiento",
    descripcion: "Cambio de chumaceras, fajas industriales y lubricación de engranajes",
    fecha: "2026-09-09T10:15:00.000Z",
    created_at: "2026-09-09T10:15:00.000Z",
    created_by: "Andrés Ramos",
    movimientos: [
      {
        id: "mov-3-1",
        fecha: "2026-09-09T10:15:00.000Z",
        usuario: "Andrés Ramos",
        accion: "Creación",
        detalle:
          'Creado por Andrés Ramos: Monto Q3,600.00, Categoría "Mantenimiento", Concepto "Mantenimiento Preventivo de Molino y Selección", Descripción: "Cambio de chumaceras, fajas industriales y lubricación de engranajes"',
      },
    ],
  },
  {
    id: "simulado-gasto-4",
    nombre: "Compra de Sacos y Empaque Serigrafiado",
    cantidad: 4200.0,
    categoria: "Compras",
    descripcion: "Lote de 1,500 sacos de polipropileno para presentación de quintales",
    fecha: "2026-09-08T11:00:00.000Z",
    created_at: "2026-09-08T11:00:00.000Z",
    created_by: "Ana Morales",
    movimientos: [
      {
        id: "mov-4-1",
        fecha: "2026-09-08T11:00:00.000Z",
        usuario: "Ana Morales",
        accion: "Creación",
        detalle:
          'Creado por Ana Morales: Monto Q4,200.00, Categoría "Compras", Concepto "Compra de Sacos y Empaque Serigrafiado"',
      },
    ],
  },
  {
    id: "simulado-gasto-5",
    nombre: "Factura Mensual de Energía Eléctrica (EEGSA)",
    cantidad: 1980.75,
    categoria: "Servicios",
    descripcion: "Consumo eléctrico de planta de procesamiento y bombas de agua",
    fecha: "2026-09-07T09:30:00.000Z",
    created_at: "2026-09-07T09:30:00.000Z",
    created_by: "Carlos Mendoza",
    movimientos: [
      {
        id: "mov-5-1",
        fecha: "2026-09-07T09:30:00.000Z",
        usuario: "Carlos Mendoza",
        accion: "Creación",
        detalle:
          'Creado por Carlos Mendoza: Monto Q1,980.75, Categoría "Servicios", Concepto "Factura Mensual de Energía Eléctrica (EEGSA)"',
      },
    ],
  },
  {
    id: "simulado-gasto-6",
    nombre: "Viáticos y Alimentación de Pilotos en Ruta",
    cantidad: 750.0,
    categoria: "Viáticos",
    descripcion: "Viáticos de 3 días de entrega en rutas departamentales",
    fecha: "2026-09-06T13:20:00.000Z",
    created_at: "2026-09-06T13:20:00.000Z",
    created_by: "Roberto Silva",
    movimientos: [
      {
        id: "mov-6-1",
        fecha: "2026-09-06T13:20:00.000Z",
        usuario: "Roberto Silva",
        accion: "Creación",
        detalle:
          'Creado por Roberto Silva: Monto Q750.00, Categoría "Viáticos", Concepto "Viáticos y Alimentación de Pilotos en Ruta"',
      },
    ],
  },
  {
    id: "simulado-gasto-7",
    nombre: "Suministros de Cafetería y Útiles de Oficina",
    cantidad: 435.0,
    categoria: "Otros",
    descripcion: "Papel bond, tinta para impresora, insumos de limpieza y café",
    fecha: "2026-09-05T08:15:00.000Z",
    created_at: "2026-09-05T08:15:00.000Z",
    created_by: "Ana Morales",
    movimientos: [
      {
        id: "mov-7-1",
        fecha: "2026-09-05T08:15:00.000Z",
        usuario: "Ana Morales",
        accion: "Creación",
        detalle:
          'Creado por Ana Morales: Monto Q435.00, Categoría "Otros", Concepto "Suministros de Cafetería y Útiles de Oficina"',
      },
    ],
  },
];
