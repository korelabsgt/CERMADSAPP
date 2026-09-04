import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import * as motion from "framer-motion/client";
import "./globals.css";
import { ThemeProvider } from "@/components/(base)/theme/provider";
import Header from "@/components/(base)/layout/header";
import { createClient } from "@/utils/supabase/server";
import Providers from "@/components/(base)/providers/QueryProviders";
import { UserProvider } from "@/components/(base)/providers/UserProvider";
import { ConnectivityShell } from "@/components/(base)/connectivity/ConnectivityShell";
import { ToastContainer } from "react-toastify";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "CERMAD S.A.",
  description:
    "Soluciones integrales en construcción y suministro de materiales de alta calidad.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CERMAD",
  },
  icons: {
    icon: "/apple-touch-icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background flex flex-col`}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <UserProvider user={user}>
              <ConnectivityShell>
                <Header />
                <main className="flex-1 w-full flex flex-col pb-8">
                  {children}
                </main>
                <footer className="relative z-10 mt-auto w-full bg-transparent">
                  <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-1.5 px-4 py-2 text-center md:flex-row md:items-center md:justify-between md:px-8 md:text-left">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-wrap items-center justify-center gap-2"
                    >
                      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                        Powered by
                      </span>
                      <span className="inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                        Kore | Software Engineering
                      </span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.08 }}
                      className="flex flex-col items-center gap-1 md:items-end"
                    >
                      <p className="text-[10px] font-bold text-foreground">
                        © 2026 Sistemas y Gobernanza Jiménez & Pinto S.A.
                      </p>
                      <span className="inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-red-600 dark:text-red-400">
                        CERMADSAPP v1.3.5
                      </span>
                    </motion.div>
                  </div>
                </footer>
              </ConnectivityShell>
            </UserProvider>
          </ThemeProvider>
        </Providers>
        <ToastContainer
          position="top-center"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="colored"
        />
        <Script
          src="https://cdn.lordicon.com/lordicon.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
