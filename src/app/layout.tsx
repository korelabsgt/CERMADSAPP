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
import { AuroraText } from "@/components/ui/aurora-text";
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
                <footer className="w-full pt-6 pb-10 md:pb-6 border-t border-border/20 bg-background z-10">
                  <div className="max-w-400 mx-auto px-6">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="flex flex-col items-center justify-center space-y-3 md:space-y-4"
                    >
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-zinc-400">
                        © 2026 CERMADSAPP
                      </p>
                      <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 text-center">
                        Powered by{" "}
                        <a
                          href="https://www.oscar27jimenez.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline cursor-pointer transition-all inline-flex items-center text-zinc-900 dark:text-zinc-100 mt-1 md:mt-0"
                        >
                          <AuroraText className="text-[10px] md:text-sm whitespace-nowrap">
                            Kore | Ingeniería de Software
                          </AuroraText>
                        </a>
                      </div>
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
