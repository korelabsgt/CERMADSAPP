export const LAARADA_SIMULATED_ROLE_KEY = "laarada-simulated-role";

export function normalizeRole(role?: string | null): string {
  return (role || "").trim().toLowerCase();
}

export function readLaAradaSimulatedRole(realRole: string): string {
  const norm = normalizeRole(realRole);
  if (norm !== "super") return norm;
  if (typeof sessionStorage === "undefined") return norm;
  const stored = sessionStorage.getItem(LAARADA_SIMULATED_ROLE_KEY);
  return stored ? normalizeRole(stored) : norm;
}

export function writeLaAradaSimulatedRole(role: string) {
  if (typeof sessionStorage === "undefined") return;
  const norm = normalizeRole(role);
  sessionStorage.setItem(LAARADA_SIMULATED_ROLE_KEY, norm);
  window.dispatchEvent(
    new CustomEvent("laarada-simulated-role-change", { detail: norm }),
  );
}

export function canUsePreventasSimular(realRole: string, effectiveRole: string): boolean {
  return normalizeRole(realRole) === "super" && normalizeRole(effectiveRole) === "super";
}

