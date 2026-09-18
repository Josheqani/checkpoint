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
      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
    >
      <LogOut className="w-4 h-4 rtl:rotate-180" />
      <span>{t("logoutButton")}</span>
    </Button>
  );
}
