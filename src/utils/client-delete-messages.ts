export function getActiveSalesTransferMessage(clientName: string, count: number) {
  const name = `<strong>${clientName}</strong>`;
  if (count === 1) {
    return `${name} tiene 1 venta activa. Busca y selecciona el cliente al que se transferirá antes de eliminar.`;
  }
  return `${name} tiene ${count} ventas activas. Busca y selecciona el cliente al que se transferirán antes de eliminar.`;
}

export function getActiveSalesReassignError(count: number) {
  if (count === 1) {
    return "Este cliente tiene 1 venta activa. Debes reasignarla a otro cliente antes de eliminarlo.";
  }
  return `Este cliente tiene ${count} ventas activas. Debes reasignarlas a otro cliente antes de eliminarlo.`;
}

export function getActiveSalesNoCandidatesError(count: number) {
  if (count === 1) {
    return "El cliente tiene 1 venta activa y no hay otro cliente al cual reasignarla.";
  }
  return `El cliente tiene ${count} ventas activas y no hay otro cliente al cual reasignarlas.`;
}

export function getAnnulledSalesWithoutClientMessage(count: number) {
  if (count <= 0) return "";
  if (count === 1) return "La venta anulada quedará sin cliente.";
  return `Las ${count} ventas anuladas quedarán sin cliente.`;
}

export function getAnnulledSalesUnlinkMessage(count: number) {
  if (count <= 0) return "";
  if (count === 1) return "Se desvinculará la venta anulada del cliente.";
  return `Se desvincularán las ${count} ventas anuladas del cliente.`;
}
