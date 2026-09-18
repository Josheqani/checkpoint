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

const vazirmatn = localFont({
  src: [
    {
      path: "../fonts/Vazirmatn-UI-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Vazirmatn-UI-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/Vazirmatn-UI-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/Vazirmatn-UI-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-vazirmatn",
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
  return {
    title: locale === "fa" ? "چک‌پوینت" : "Checkpoint",
    description:
      locale === "fa"
        ? "استقرار Next.js روی کلودفلر ورکرز با آداپتور OpenNext"
        : "Next.js App Router on Cloudflare Workers via OpenNext",
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
      className={
        isFa
          ? `${vazirmatn.className} ${vazirmatn.variable}`
          : `${geistSans.className} ${geistSans.variable} ${geistMono.variable}`
      }
    >
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col selection:bg-primary-container selection:text-on-primary-container">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <header className="w-full border-b border-outline-variant/30 bg-surface/85 backdrop-blur-md sticky top-0 z-50 transition-shadow">
            <div className="max-w-5xl mx-auto flex items-center justify-between p-3.5 sm:px-6">
              <Link
                href="/"
                className="flex items-center gap-2.5 font-semibold text-base sm:text-lg tracking-tight hover:opacity-90 transition-opacity"
              >
                <div className="w-8 h-8 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-black text-xs shadow-xs">
                  CP
                </div>
                <span>{isFa ? "چک‌پوینت" : "Checkpoint"}</span>
              </Link>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <LocaleSwitcher />
                {isLoggedIn && <LogoutButton />}
              </div>
            </div>
          </header>
          <main className="flex-1 flex flex-col">{children}</main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
