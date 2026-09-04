import { NextRequest, NextResponse } from "next/server";
import { buildXMLAnulacion, anularDTE } from "@/lib/infile";
import {
  isConsumidorFinalNit,
  mensajePlazoAnulacionCf,
  plazoAnulacionInmediata,
} from "@/lib/fel-anulacion";
import { createAdminClient } from "@/utils/supabase/admin";
import type { AnulacionDTEInput } from "@/types/infile";

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as AnulacionDTEInput & { dte_id?: string };

    const required: (keyof AnulacionDTEInput)[] = [
      "nitEmisor",
      "idReceptor",
      "uuidAAnular",
      "fechaEmisionDocumento",
      "fechaHoraAnulacion",
      "motivoAnulacion",
    ];

    for (const field of required) {
      if (!input[field]) {
        return NextResponse.json(
          { error: `El campo '${field}' es obligatorio.` },
          { status: 400 }
        );
      }
    }

    if (isConsumidorFinalNit(input.idReceptor)) {
      const plazo = plazoAnulacionInmediata(input.fechaEmisionDocumento);
      if (!plazo.permitido) {
        return NextResponse.json(
          { error: mensajePlazoAnulacionCf(plazo) },
          { status: 400 },
        );
      }
    }

    const xml = buildXMLAnulacion(input);
    const respuesta = await anularDTE(xml);

    // ─── Persistir en Supabase ────────────────────────────────────────────────
    const supabase = createAdminClient();

    // Buscar el dte_documentos por uuid_infile si no viene dte_id
    let dteId = input.dte_id ?? null;
    if (!dteId) {
      const { data } = await supabase
        .from("dte_documentos")
        .select("id")
        .eq("uuid_infile", input.uuidAAnular)
        .single();
      dteId = data?.id ?? null;
    }

    if (dteId) {
      // Guardar registro de anulación
      await supabase.from("dte_anulaciones").insert({
        dte_id: dteId,
        motivo: input.motivoAnulacion,
        fecha_anulacion: input.fechaHoraAnulacion,
        resultado_infile: respuesta.resultado,
        descripcion_infile: respuesta.descripcion ?? null,
      });

      // Actualizar estado del DTE si fue exitoso
      if (respuesta.resultado) {
        await supabase
          .from("dte_documentos")
          .update({ estado: "anulado" })
          .eq("id", dteId);
          
        const { data: docData } = await supabase
          .from("dte_documentos")
          .select("venta_id")
          .eq("id", dteId)
          .single();
          
        if (docData?.venta_id) {
          await supabase
            .from("ven_ventas")
            .update({ tipo_comprobante: "Recibo" })
            .eq("id", docData.venta_id);
        }
      }
    }

    return NextResponse.json(respuesta);
  } catch (error) {
    console.error("[INFILE anular]", error);
    return NextResponse.json(
      { error: "Error al anular el documento con INFILE." },
      { status: 500 }
    );
  }
}

