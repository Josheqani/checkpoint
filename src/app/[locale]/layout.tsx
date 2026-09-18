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
  src: "../fonts/Vazirmatn[wght].woff2",
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
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <header className="w-full border-b bg-background/95 backdrop-blur sticky top-0 z-50">
            <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                <span>{isFa ? "چک‌پوینت" : "Checkpoint"}</span>
              </Link>
              <div className="flex items-center gap-3">
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
