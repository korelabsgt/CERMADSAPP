import { ClienteCredito } from "./zod";

export function toClienteSlug(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getClienteSlug(
  cliente: ClienteCredito,
  clientes: ClienteCredito[],
) {
  const base = toClienteSlug(cliente.nombre);
  const mismos = clientes.filter((c) => toClienteSlug(c.nombre) === base);
  if (mismos.length <= 1) return base;
  return `${base}-${cliente.cliente_id.slice(0, 6).toLowerCase()}`;
}

export function findClienteBySlug(
  slug: string,
  clientes: ClienteCredito[],
): ClienteCredito | null {
  const byHref = clientes.find((c) => getClienteSlug(c, clientes) === slug);
  if (byHref) return byHref;
  return clientes.find((c) => toClienteSlug(c.nombre) === slug) ?? null;
}

export function slugToBreadcrumbLabel(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
