import Swal from "sweetalert2";

const applySwalLayerStyles = () => {
  const container = Swal.getContainer();
  if (container) {
    container.style.setProperty("z-index", "99999", "important");
  }
  const popup = Swal.getPopup();
  if (popup) popup.style.borderRadius = "16px";
  Swal.getConfirmButton()?.style.setProperty("border-radius", "12px");
  Swal.getCancelButton()?.style.setProperty("border-radius", "12px");
};

const getSwalTheme = () => {
  const isDark = document.documentElement.classList.contains("dark");
  return {
    background: isDark ? "#18181b" : "#ffffff",
    color: isDark ? "#ffffff" : "#000000",
    cancelButtonColor: isDark ? "#3f3f46" : "#6b7280",
  };
};

export const showConfirm = (options: {
  title: string;
  html?: string;
  text?: string;
  icon?: "warning" | "question" | "error";
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
}) => {
  return Swal.fire({
    ...getSwalTheme(),
    icon: options.icon ?? "warning",
    title: options.title,
    html: options.html,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText ?? "Confirmar",
    cancelButtonText: options.cancelButtonText ?? "Cancelar",
    confirmButtonColor: options.confirmButtonColor ?? "#ef4444",
    customClass: {
      popup: "rounded-3xl border border-border/50",
    },
    didOpen: applySwalLayerStyles,
  });
};

export const showReassignClientDialog = (options: {
  clientName: string;
  activeCount: number;
  annulledCount: number;
  candidates: Array<{ id: string; label: string }>;
}) => {
  const optionsHtml = options.candidates
    .map(
      (client) =>
        `<option value="${client.id}">${client.label.replace(/"/g, "&quot;")}</option>`,
    )
    .join("");

  const annulledNote =
    options.annulledCount > 0
      ? `<p class="text-xs mt-2 opacity-80">Las ${options.annulledCount} venta(s) anulada(s) quedarán sin cliente.</p>`
      : "";

  return Swal.fire({
    ...getSwalTheme(),
    icon: "warning",
    title: "Reasignar ventas activas",
    html: `
      <p class="text-sm leading-relaxed">
        <strong>${options.clientName}</strong> tiene
        <strong>${options.activeCount}</strong> venta(s) activa(s).
        Selecciona el cliente al que se transferirán antes de eliminar.
      </p>
      ${annulledNote}
      <select id="swal-reassign-client" class="swal2-select mt-4 w-full rounded-xl border px-3 py-2 text-sm outline-none">
        <option value="">Seleccione un cliente...</option>
        ${optionsHtml}
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: "Reasignar y eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#ef4444",
    customClass: {
      popup: "rounded-3xl border border-border/50",
    },
    focusConfirm: false,
    preConfirm: () => {
      const select = document.getElementById(
        "swal-reassign-client",
      ) as HTMLSelectElement | null;
      if (!select?.value) {
        Swal.showValidationMessage("Debes seleccionar un cliente destino.");
        return false;
      }
      return select.value;
    },
    didOpen: applySwalLayerStyles,
  });
};

export const showToast = (
  icon: "success" | "error" | "warning" | "info",
  title: string,
  position:
    | "top"
    | "top-start"
    | "top-end"
    | "center"
    | "bottom"
    | "bottom-start"
    | "bottom-end" = "top-end",
) => {
  const isDark = document.documentElement.classList.contains("dark");
  const Toast = Swal.mixin({
    toast: true,
    position,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: isDark ? "#121212" : "#ffffff",
    color: isDark ? "#fff" : "#09090b",
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
      applySwalLayerStyles();
    },
  });
  Toast.fire({ icon, title });
};

export const showAlert = (
  icon: "success" | "error" | "warning",
  title: string,
  text: string,
) => {
  return Swal.fire({
    ...getSwalTheme(),
    icon,
    title,
    text,
    confirmButtonColor: "#ea580c",
    customClass: {
      popup: "rounded-3xl border border-border/50 backdrop-blur-xl",
    },
    didOpen: applySwalLayerStyles,
  });
};
