"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(nextLocale: "en" | "fa") {
    router.replace(pathname, { locale: nextLocale });
  }

  const otherLocale = locale === "en" ? "fa" : "en";
  const otherLocaleLabel = locale === "en" ? "فارسی" : "EN";

  return (
    <div className="flex items-center">
      {/* Mobile compact single button (<sm) */}
      <div className="sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => switchLocale(otherLocale)}
          className="h-8 px-2.5 rounded-full text-xs font-semibold border-outline-variant/40 bg-surface-container hover:bg-surface-container-high transition-colors"
          title={`Switch to ${otherLocaleLabel}`}
        >
          {otherLocaleLabel}
        </Button>
      </div>

      {/* Desktop dual toggle pills (>=sm) */}
      <div className="hidden sm:inline-flex items-center rounded-full border border-outline-variant/50 bg-surface-container p-1 shadow-2xs">
        <Button
          variant={locale === "en" ? "default" : "ghost"}
          size="sm"
          className={cn(
            "h-7 rounded-full px-3 text-xs font-medium transition-all duration-150",
            locale === "en"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          )}
          onClick={() => switchLocale("en")}
        >
          English
        </Button>
        <Button
          variant={locale === "fa" ? "default" : "ghost"}
          size="sm"
          className={cn(
            "h-7 rounded-full px-3 text-xs font-medium transition-all duration-150",
            locale === "fa"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          )}
          onClick={() => switchLocale("fa")}
        >
          فارسی
        </Button>
      </div>
    </div>
  );
}
