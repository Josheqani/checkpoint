import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { routing, Link } from "@/i18n/routing";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoutButton } from "@/components/logout-button";
import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import { PwaRegister } from "@/components/pwa-register";
import { SettingsProvider } from "@/lib/settings-context";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import {
  SESSION_COOKIE_NAME,
  getSessionSecret,
  verifySessionToken,
} from "@/lib/session";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hamishe = localFont({
  src: [
    {
      path: "../fonts/Digi-Hamishe-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Digi-Hamishe-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-hamishe",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isFa = locale === "fa";
  return {
    title: isFa ? "چک‌پوینت | مدیریت اهداف و یادآورها" : "Checkpoint | Goals & Automated Reminders",
    description:
      locale === "fa"
        ? "پیگیری اهداف و دریافت یادآورهای خودکار پیامکی"
        : "Track goals and receive automated SMS reminders with Checkpoint",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: isFa ? "چک‌پوینت" : "Checkpoint",
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const isFa = locale === "fa";

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const secret = getSessionSecret();
  const { valid: isLoggedIn } = await verifySessionToken(
    sessionCookie || "",
    secret
  );

  return (
    <html
      lang={locale}
      dir={isFa ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={
        isFa
          ? `${hamishe.className} ${hamishe.variable}`
          : `${geistSans.className} ${geistSans.variable} ${geistMono.variable}`
      }
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("checkpoint-theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches);if(d){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col selection:bg-primary-container selection:text-on-primary-container">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <SettingsProvider locale={locale}>
              <header className="w-full border-b border-outline-variant/30 bg-surface/85 backdrop-blur-md sticky top-0 z-50 transition-shadow">
                <div className="max-w-5xl mx-auto flex items-center justify-between p-3.5 sm:px-6 gap-2 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <Link
                      href="/"
                      className="flex items-center gap-2.5 font-semibold text-base sm:text-lg tracking-tight hover:opacity-90 transition-opacity shrink-0"
                    >
                      <img
                        src="/favicon.svg"
                        alt="Checkpoint"
                        className="w-8 h-8 rounded-xl shadow-xs shrink-0"
                      />
                      <span className="hidden xs:inline">{isFa ? "چک‌پوینت" : "Checkpoint"}</span>
                    </Link>
                    {isLoggedIn && <MainNav />}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <ThemeToggle />
                    <LocaleSwitcher />
                    {isLoggedIn && <LogoutButton />}
                  </div>
                </div>
              </header>
              <main className="flex-1 flex flex-col pb-20 sm:pb-8">{children}</main>
              {isLoggedIn && <MobileNav />}
              <PwaRegister />
              <Toaster />
            </SettingsProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
