-- Arreglo simple para fin_reporte_regalias
-- 1) La vista respeta permisos del usuario (quita el aviso del Advisor)
-- 2) Solo usuarios autenticados pueden leerla (no anon / público)

ALTER VIEW public.fin_reporte_regalias SET (security_invoker = on);

REVOKE ALL ON public.fin_reporte_regalias FROM PUBLIC;
REVOKE ALL ON public.fin_reporte_regalias FROM anon;

GRANT SELECT ON public.fin_reporte_regalias TO authenticated;
