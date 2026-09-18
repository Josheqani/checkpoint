"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Target, History } from "lucide-react";
import { cn } from "@/lib/utils";

export function MainNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const isGoals =
    pathname.endsWith("/goals") ||
    pathname.includes("/goals/") ||
    pathname === "/" ||
    pathname === "/en" ||
    pathname === "/fa";

  const isHistory = pathname.includes("/history");

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
  ];

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-150",
              link.active
                ? "bg-secondary-container text-on-secondary-container font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
            )}
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
