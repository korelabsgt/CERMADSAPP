export const LAARADA_SIMULATED_ROLE_KEY = "laarada-simulated-role";

export function readLaAradaSimulatedRole(realRole: string): string {
  if (realRole !== "super") return realRole;
  if (typeof sessionStorage === "undefined") return realRole;
  return sessionStorage.getItem(LAARADA_SIMULATED_ROLE_KEY) || realRole;
}

export function writeLaAradaSimulatedRole(role: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(LAARADA_SIMULATED_ROLE_KEY, role);
  window.dispatchEvent(
    new CustomEvent("laarada-simulated-role-change", { detail: role }),
  );
}

export function canUsePreventasSimular(realRole: string, effectiveRole: string): boolean {
  return realRole === "super" && effectiveRole === "super";
}
