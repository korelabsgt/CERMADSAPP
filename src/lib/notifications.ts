import Swal from "sweetalert2";
import {
  getActiveSalesTransferMessage,
  getAnnulledSalesWithoutClientMessage,
} from "@/utils/client-delete-messages";

const applySwalLayerStyles = (buttonRadius = "12px") => {
  const container = Swal.getContainer();
  if (container) {
    container.style.setProperty("z-index", "99999", "important");
  }
  const popup = Swal.getPopup();
  if (popup) popup.style.borderRadius = "16px";
  Swal.getConfirmButton()?.style.setProperty("border-radius", buttonRadius);
  Swal.getCancelButton()?.style.setProperty("border-radius", buttonRadius);
};

function wireSearchableClientPicker(
  candidates: Array<{ id: string; label: string }>,
) {
  const searchInput = document.getElementById(
    "swal-reassign-search",
  ) as HTMLInputElement | null;
  const hiddenInput = document.getElementById(
    "swal-reassign-client-id",
  ) as HTMLInputElement | null;
  const resultsEl = document.getElementById(
    "swal-reassign-results",
  ) as HTMLDivElement | null;
  const selectedEl = document.getElementById(
    "swal-reassign-selected",
  ) as HTMLParagraphElement | null;

  if (!searchInput || !hiddenInput || !resultsEl) return;

  const isDark = document.documentElement.classList.contains("dark");
  const itemHover = isDark ? "#27272a" : "#f4f4f5";
  const borderColor = isDark ? "#3f3f46" : "#e4e4e7";
  const textColor = isDark ? "#fafafa" : "#18181b";

  let selectedId = "";

  const render = (term: string) => {
    const q = term.trim().toLowerCase();
    const filtered = candidates.filter((c) =>
      c.label.toLowerCase().includes(q),
    );

    resultsEl.innerHTML = "";

    if (filtered.length === 0) {
      resultsEl.innerHTML =
        '<p style="padding:8px 12px;font-size:12px;opacity:0.6;text-align:center;">Sin resultados</p>';
      return;
    }

    filtered.slice(0, 80).forEach((client) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.style.cssText = `display:block;width:100%;text-align:left;padding:8px 12px;font-size:13px;border:none;border-bottom:1px solid ${borderColor};background:transparent;color:${textColor};cursor:pointer;`;
      if (client.id === selectedId) {
        btn.style.background = itemHover;
        btn.style.fontWeight = "600";
      }
      btn.textContent = client.label;
      btn.addEventListener("mouseenter", () => {
        if (client.id !== selectedId) btn.style.background = itemHover;
      });
      btn.addEventListener("mouseleave", () => {
        if (client.id !== selectedId) btn.style.background = "transparent";
      });
      btn.addEventListener("click", () => {
        selectedId = client.id;
        hiddenInput.value = client.id;
        if (selectedEl) {
          selectedEl.textContent = `Seleccionado: ${client.label}`;
          selectedEl.style.display = "block";
        }
        render(searchInput.value);
      });
      resultsEl.appendChild(btn);
    });
  };

  searchInput.addEventListener("input", () => render(searchInput.value));
  render("");
  setTimeout(() => searchInput.focus(), 50);
}

const applyReassignSwalStyles = (
  candidates: Array<{ id: string; label: string }>,
) => {
  applySwalLayerStyles("6px");

  const popup = Swal.getPopup();
  const title = Swal.getTitle();
  const html = Swal.getHtmlContainer();
  const actions = Swal.getActions();
  const icon = Swal.getIcon();

  if (popup) {
    popup.style.borderRadius = "16px";
    popup.style.padding = "1.5rem 1.5rem 1.25rem";
    popup.style.overflow = "visible";
  }

  if (icon) {
    icon.style.margin = "0.5rem auto 1rem";
    icon.style.width = "4rem";
    icon.style.height = "4rem";
  }

  if (title) {
    title.style.textAlign = "center";
    title.style.marginTop = "0";
    title.style.marginBottom = "0.75rem";
    title.style.padding = "0";
  }

  if (html) {
    html.style.textAlign = "center";
    html.style.marginTop = "0";
    html.style.padding = "0 0.25rem";
  }

  if (actions) {
    actions.style.display = "flex";
    actions.style.justifyContent = "center";
    actions.style.gap = "12px";
    actions.style.width = "100%";
    actions.style.marginTop = "1rem";
    actions.style.padding = "0";
  }

  wireSearchableClientPicker(candidates);
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
    didOpen: () => applySwalLayerStyles(),
  });
};

export const showReassignClientDialog = (options: {
  clientName: string;
  activeCount: number;
  annulledCount: number;
  candidates: Array<{ id: string; label: string }>;
}) => {
  const annulledNote =
    options.annulledCount > 0
      ? `<p style="font-size:12px;margin-top:8px;opacity:0.8;text-align:center;">${getAnnulledSalesWithoutClientMessage(options.annulledCount)}</p>`
      : "";

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const inputBg = isDark ? "#27272a" : "#ffffff";
  const inputBorder = isDark ? "#3f3f46" : "#e4e4e7";
  const inputColor = isDark ? "#fafafa" : "#18181b";

  return Swal.fire({
    ...getSwalTheme(),
    icon: "warning",
    title: "Reasignar ventas activas",
    width: "28rem",
    padding: "1.5rem",
    html: `
      <div style="text-align:center;">
        <p style="font-size:14px;line-height:1.5;margin:0;">
          ${getActiveSalesTransferMessage(options.clientName, options.activeCount)}
        </p>
        ${annulledNote}
        <div style="margin:16px auto 0;max-width:100%;text-align:left;">
          <input
            type="text"
            id="swal-reassign-search"
            placeholder="Buscar por nombre o NIT..."
            style="width:100%;box-sizing:border-box;border:1px solid ${inputBorder};border-radius:10px;padding:10px 12px;font-size:14px;background:${inputBg};color:${inputColor};outline:none;"
          />
          <input type="hidden" id="swal-reassign-client-id" value="" />
          <div
            id="swal-reassign-results"
            style="margin-top:8px;max-height:160px;overflow-y:auto;border:1px solid ${inputBorder};border-radius:10px;background:${inputBg};"
          ></div>
          <p
            id="swal-reassign-selected"
            style="display:none;font-size:12px;margin-top:8px;text-align:center;opacity:0.85;"
          ></p>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Reasignar y eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#ef4444",
    customClass: {
      popup: "rounded-3xl border border-border/50",
      actions: "swal-reassign-actions",
    },
    focusConfirm: false,
    preConfirm: () => {
      const hiddenInput = document.getElementById(
        "swal-reassign-client-id",
      ) as HTMLInputElement | null;
      if (!hiddenInput?.value) {
        Swal.showValidationMessage("Debes buscar y seleccionar un cliente.");
        return false;
      }
      return hiddenInput.value;
    },
    didOpen: () => applyReassignSwalStyles(options.candidates),
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
    didOpen: () => applySwalLayerStyles(),
  });
};
