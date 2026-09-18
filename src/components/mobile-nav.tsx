"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Target, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const isGoals =
    pathname.endsWith("/goals") ||
    pathname.includes("/goals/") ||
    pathname === "/" ||
    pathname === "/en" ||
    pathname === "/fa";

  const isHistory = pathname.includes("/history");
  const isSettings = pathname.includes("/settings");

  const links = [
    {
      href: "/goals",
      label: t("goals"),
      icon: Target,
      active: isGoals,
    },
    {
      href: "/history",
      label: t("history"),
      icon: History,
      active: isHistory,
    },
    {
      href: "/settings",
      label: t("settings"),
      icon: Settings,
      active: isSettings,
    },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-outline-variant/30 px-4 py-2 flex items-center justify-around shadow-lg">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-1 rounded-2xl text-[11px] font-medium transition-all duration-150",
              link.active
                ? "text-primary font-bold bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
