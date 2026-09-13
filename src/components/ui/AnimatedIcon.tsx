"use client";

import { useEffect, useRef } from "react";

interface AnimatedIconProps {
  iconKey: string;
  className?: string;
  target?: string;
  delay?: string | number;
  speed?: string | number;
  primaryColor?: string;
  secondaryColor?: string;
}

function waitForLordIcon(timeoutMs = 8000): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (customElements.get("lord-icon")) return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    customElements.whenDefined("lord-icon").then(() => done(true));
    window.setTimeout(() => done(Boolean(customElements.get("lord-icon"))), timeoutMs);
  });
}

export default function AnimatedIcon({
  iconKey,
  className = "w-24 h-24",
  target,
  delay = 0,
  speed = 2,
  primaryColor,
  secondaryColor,
}: AnimatedIconProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;

    const mount = async () => {
      await waitForLordIcon();
      if (cancelled || !hostRef.current) return;

      const el = document.createElement("lord-icon");
      el.setAttribute("src", `https://cdn.lordicon.com/${iconKey}.json`);
      el.setAttribute("trigger", "hover");
      if (target) el.setAttribute("target", target);
      el.setAttribute("delay", String(delay));
      el.setAttribute("speed", String(speed));

      const colors = [];
      if (primaryColor) colors.push(`primary:${primaryColor}`);
      if (secondaryColor) colors.push(`secondary:${secondaryColor}`);
      if (colors.length > 0) el.setAttribute("colors", colors.join(","));
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.display = "block";

      host.replaceChildren(el);
    };

    void mount();

    return () => {
      cancelled = true;
      host.replaceChildren();
    };
  }, [iconKey, target, delay, speed, primaryColor, secondaryColor]);

  return <div ref={hostRef} className={className} />;
}
