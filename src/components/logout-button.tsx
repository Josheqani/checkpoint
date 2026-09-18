"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      startTransition(() => {
        router.push(`/${locale}/login`);
        router.refresh();
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-full h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/5 cursor-pointer transition-colors"
    >
      <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
      <span>{t("logoutButton")}</span>
    </Button>
  );
}
