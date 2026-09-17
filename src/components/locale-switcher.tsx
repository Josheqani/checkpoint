"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(nextLocale: "en" | "fa") {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center gap-2">
      <Languages className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="inline-flex items-center rounded-lg border bg-muted/30 p-1">
        <Button
          variant={locale === "en" ? "default" : "ghost"}
          size="sm"
          className="h-7 px-3 text-xs font-medium"
          onClick={() => switchLocale("en")}
        >
          English
        </Button>
        <Button
          variant={locale === "fa" ? "default" : "ghost"}
          size="sm"
          className="h-7 px-3 text-xs font-medium"
          onClick={() => switchLocale("fa")}
        >
          فارسی
        </Button>
      </div>
    </div>
  );
}
