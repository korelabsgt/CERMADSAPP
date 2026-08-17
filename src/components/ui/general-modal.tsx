"use client";

import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export const modalCancelClassName =
  "inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-xl border border-zinc-500 bg-zinc-500/10 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600 shadow-none transition-colors hover:bg-zinc-500/20 cursor-pointer sm:flex-none sm:px-6 dark:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50";

export const modalSubmitClassName =
  "inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-500/10 px-4 text-[10px] font-bold uppercase tracking-widest text-emerald-700 shadow-none transition-colors hover:bg-emerald-500/20 active:scale-95 cursor-pointer sm:flex-none sm:px-6 dark:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50";

export function ModalFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shrink-0 flex w-full items-center justify-between gap-3 bg-zinc-100 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-zinc-800 sm:rounded-b-3xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ModalCancel({
  className,
  children = "Cancelar",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cn(modalCancelClassName, className)} {...props}>
      {children}
    </button>
  );
}

export function ModalSubmit({
  className,
  children = "Guardar",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cn(modalSubmitClassName, className)} {...props}>
      {children}
    </button>
  );
}

export function ModalLabel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-[10px] font-bold uppercase tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export function ModalInput({
  className,
  hasError,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
}) {
  return (
    <input
      className={cn(
        "w-full h-11 px-3 rounded-xl border-2 bg-transparent text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30 transition-all",
        hasError ? "border-red-500" : "border-celeste-trifinio",
        className,
      )}
      {...props}
    />
  );
}

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
}

export function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidthClassName = "sm:max-w-2xl",
}: ModalShellProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white/75 backdrop-blur-sm p-0 text-foreground dark:bg-black/75 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          "relative flex h-dvh w-full flex-col bg-zinc-100 dark:bg-zinc-900 sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:shadow-lg",
          maxWidthClassName,
        )}
      >
        <div className="flex items-center justify-between bg-zinc-100 px-5 py-4 dark:bg-zinc-800 sm:rounded-t-3xl pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
          <div className="min-w-0">
            <h2 className="text-base font-black uppercase tracking-tight text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-azul-trifinio transition-colors hover:bg-sky-100 cursor-pointer dark:hover:bg-sky-950"
            aria-label="Cerrar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-zinc-100 px-5 py-5 dark:bg-zinc-900">
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
}
