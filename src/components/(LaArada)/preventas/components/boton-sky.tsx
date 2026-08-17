"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ventaBtnClass } from "../lib/ui";

export function BotonSky({
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type={type} className={cn(ventaBtnClass, className)} {...props}>
      {children}
    </button>
  );
}

export default BotonSky;
