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
