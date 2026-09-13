import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (!user && pathname.startsWith("/cermadsa")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

if (user) {
    const { data: settings } = await supabase
      .from("app_settings")
      .select("require_device_authorization")
      .limit(1)
      .maybeSingle();

    const requireAuth = settings?.require_device_authorization ?? false;

    if (pathname === "/esperando-acceso") {
      if (!requireAuth) {
        const url = request.nextUrl.clone();
        url.pathname = "/cermadsa";
        return NextResponse.redirect(url);
      }

      const metadata = user.user_metadata || {};
      const realRole = (metadata.rol || user.role || "user") as string;

      if (["super", "admin", "rrhh"].includes(realRole)) {
        const url = request.nextUrl.clone();
        url.pathname = "/cermadsa";
        return NextResponse.redirect(url);
      }

      const userAgent = request.headers.get("user-agent") || "Desconocido";

      const { data: device } = await supabase
        .from("authorized_devices")
        .select("is_authorized")
        .eq("user_id", user.id)
        .eq("browser_fingerprint", userAgent)
        .single();

      if (device && device.is_authorized) {
        const url = request.nextUrl.clone();
        url.pathname = "/cermadsa";
        return NextResponse.redirect(url);
      }
    }

    if (pathname === "/laarada" || pathname.startsWith("/laarada/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/cermadsa/laarada/ventas";
      return NextResponse.redirect(url);
    }

    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      const metadata = user.user_metadata || {};
      const realRole = (metadata.rol || user.role || "user") as string;
      url.pathname = realRole === "user" ? "/cermadsa/laarada/ventas" : "/cermadsa";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/cermadsa")) {
      const metadata = user.user_metadata || {};
      const realRole = (metadata.rol || user.role || "user") as string;

      if (realRole === "user") {
        if (
          pathname === "/cermadsa" ||
          pathname === "/cermadsa/" ||
          pathname === "/cermadsa/laarada" ||
          pathname === "/cermadsa/laarada/"
        ) {
          const url = request.nextUrl.clone();
          url.pathname = "/cermadsa/laarada/ventas";
          return NextResponse.redirect(url);
        }

        if (
          pathname.startsWith("/cermadsa/laarada/") &&
          pathname !== "/cermadsa/laarada/ventas" &&
          !pathname.startsWith("/cermadsa/laarada/ventas/")
        ) {
          const url = request.nextUrl.clone();
          url.pathname = "/cermadsa/laarada/ventas";
          return NextResponse.redirect(url);
        }
      }

      if (
        pathname.startsWith("/cermadsa/admin") &&
        !["super", "admin", "rrhh"].includes(realRole)
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/sin-acceso";
        return NextResponse.redirect(url);
      }

      if (requireAuth && !["super", "admin"].includes(realRole)) {
        const userAgent = request.headers.get("user-agent") || "Desconocido";

        const { data: device } = await supabase
          .from("authorized_devices")
          .select("is_authorized")
          .eq("user_id", user.id)
          .eq("browser_fingerprint", userAgent)
          .single();

        if (!device || !device.is_authorized) {
          const url = request.nextUrl.clone();
          url.pathname = "/esperando-acceso";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return response;
}
// Exclusion de cobros por archivos estáticos
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|csv|xlsx|woff|woff2|tff|otf|js|css)$).*)",
  ],
};
