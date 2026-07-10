"use client";

import { useState } from "react";
import {
  MoreVertical,
  ShoppingCart,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ClientRowActionsProps {
  canDelete: boolean;
  isDeleting?: boolean;
  onViewSales: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ActionItem({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  disabled,
}: {
  icon: typeof ShoppingCart;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors disabled:opacity-50 ${
        variant === "danger"
          ? "text-red-600 hover:bg-red-500/10"
          : "text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  );
}

export default function ClientRowActions({
  canDelete,
  isDeleting,
  onViewSales,
  onEdit,
  onDelete,
}: ClientRowActionsProps) {
  const [open, setOpen] = useState(false);

  const runAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <div className="flex justify-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="p-2 rounded-lg border bg-background hover:bg-muted transition-colors cursor-pointer inline-flex"
            aria-label="Opciones del cliente"
          >
            <MoreVertical className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={8}
          className="z-[10050] w-52 p-1.5 rounded-xl border border-border !bg-background text-foreground shadow-xl"
        >
          <ActionItem
            icon={ShoppingCart}
            label="Ver ventas"
            onClick={() => runAction(onViewSales)}
          />
          <ActionItem
            icon={Pencil}
            label="Editar"
            onClick={() => runAction(onEdit)}
          />
          {canDelete && (
            <ActionItem
              icon={Trash2}
              label="Eliminar"
              onClick={() => runAction(onDelete)}
              variant="danger"
              disabled={isDeleting}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
