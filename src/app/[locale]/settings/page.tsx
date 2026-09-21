"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Calendar,
  Phone,
  Check,
  Sparkles,
  ShieldCheck,
  Send,
  ExternalLink,
  Loader2,
  Bot,
  AlertCircle,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSettings, type CalendarType } from "@/lib/settings-context";
import { TelegramConnectCard } from "@/components/telegram/telegram-connect-card";
import { iranianPhoneRegex } from "@/lib/validations/reminder";
import * as jalaali from "jalaali-js";

const JALALI_MONTHS_FA = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const GREGORIAN_MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function SettingsPage() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const isFa = locale === "fa";

  const {
    calendarType,
    setCalendarType,
    defaultPhoneNumber,
    setDefaultPhoneNumber,
  } = useSettings();

  const [phoneInput, setPhoneInput] = React.useState(defaultPhoneNumber);
  const [phoneError, setPhoneError] = React.useState<string | null>(null);

  const [botInfo, setBotInfo] = React.useState<{
    isConfigured: boolean;
    botUsername?: string | null;
    botFirstName?: string | null;
    error?: string | null;
  } | null>(null);
  const [loadingBot, setLoadingBot] = React.useState(true);

  React.useEffect(() => {
    setPhoneInput(defaultPhoneNumber);
  }, [defaultPhoneNumber]);

  React.useEffect(() => {
    fetch("/api/telegram/info")
      .then((res) => res.json())
      .then((data: any) => {
        setBotInfo(data);
      })
      .catch(() => {})
      .finally(() => setLoadingBot(false));
  }, []);

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneInput.trim();
    if (cleaned && !iranianPhoneRegex.test(cleaned)) {
      setPhoneError(
        isFa
          ? "شماره موبایل وارد شده معتبر نیست (مثال: 09123456789)"
          : "Invalid mobile number (e.g. 09123456789)"
      );
      return;
    }
    setPhoneError(null);
    setDefaultPhoneNumber(cleaned);
    toast.success(
      isFa
        ? "شماره همراه پیش‌فرض در حافظه مرورگر ذخیره شد"
        : "Default phone number saved locally"
    );
  };

  const handleSelectCalendar = (type: CalendarType) => {
    setCalendarType(type);
    toast.success(
      isFa
        ? `تقویم پیش‌فرض به ${type === "jalali" ? "جلالی (شمسی)" : "میلادی"} تغییر یافت`
        : `Calendar preference set to ${type === "jalali" ? "Jalali" : "Gregorian"}`
    );
  };

  // Preview date for today
  const today = new Date();
  const jalaliToday = jalaali.toJalaali(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );
  const jalaliDisplay = `${jalaliToday.jd} ${JALALI_MONTHS_FA[jalaliToday.jm - 1]} ${jalaliToday.jy}`;
  const gregorianDisplay = `${today.getDate()} ${GREGORIAN_MONTHS_EN[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-xs">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Calendar Selection Card */}
        <Card className="rounded-3xl border border-outline-variant/40 bg-surface-container-low shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-semibold">{t("calendarTitle")}</CardTitle>
            </div>
            <CardDescription className="text-xs">
              {t("calendarDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Jalali Option */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleSelectCalendar("jalali")}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelectCalendar("jalali")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                calendarType === "jalali"
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-outline-variant/30 hover:border-outline-variant/70 bg-surface"
              }`}
            >
              <div className="space-y-1">
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  <span>{t("jalaliLabel")}</span>
                  {calendarType === "jalali" && (
                    <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {isFa ? "فعال" : "Active"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("jalaliHint")}
                </p>
                <div className="pt-1 text-xs font-mono text-primary font-medium">
                  {isFa ? "نمونه امروز: " : "Preview today: "} {jalaliDisplay}
                </div>
              </div>
              {calendarType === "jalali" && (
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Gregorian Option */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleSelectCalendar("gregorian")}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelectCalendar("gregorian")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                calendarType === "gregorian"
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-outline-variant/30 hover:border-outline-variant/70 bg-surface"
              }`}
            >
              <div className="space-y-1">
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  <span>{t("gregorianLabel")}</span>
                  {calendarType === "gregorian" && (
                    <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {isFa ? "فعال" : "Active"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("gregorianHint")}
                </p>
                <div className="pt-1 text-xs font-mono text-primary font-medium">
                  {isFa ? "نمونه امروز: " : "Preview today: "} {gregorianDisplay}
                </div>
              </div>
              {calendarType === "gregorian" && (
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Default Phone Number Card */}
        <Card className="rounded-3xl border border-outline-variant/40 bg-surface-container-low shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <CardTitle className="text-base font-semibold">{t("phoneTitle")}</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {t("phoneDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSavePhone} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="defaultPhone" className="text-xs font-medium">
                    {t("phoneLabel")}
                  </Label>
                  <Input
                    id="defaultPhone"
                    dir="ltr"
                    placeholder="09123456789"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    className="font-mono text-start"
                  />
                  {phoneError ? (
                    <p className="text-xs text-destructive">{phoneError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t("phoneHint")}
                    </p>
                  )}
                </div>

                <Button type="submit" size="sm" className="rounded-full cursor-pointer gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{t("saveButton")}</span>
                </Button>
              </form>
            </CardContent>
          </div>

          <div className="p-4 m-4 rounded-2xl bg-surface/60 border border-outline-variant/30 flex items-center gap-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{t("privacyNote")}</span>
          </div>
        </Card>

        {/* Telegram Integration Card */}
        <Card className="rounded-3xl border border-outline-variant/40 bg-surface-container-low shadow-sm md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">{t("telegramTitle")}</CardTitle>
                  <CardDescription className="text-xs">
                    {t("telegramDescription")}
                  </CardDescription>
                </div>
              </div>

              {/* Bot status badge */}
              {!loadingBot && (
                <Badge
                  variant={botInfo?.isConfigured ? "default" : "outline"}
                  className={`text-xs gap-1.5 px-3 py-1 ${
                    botInfo?.isConfigured
                      ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                      : "text-amber-600 border-amber-500/30"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      botInfo?.isConfigured ? "bg-white animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  <span>
                    {botInfo?.isConfigured
                      ? `${t("telegramConfigured")} (@${botInfo.botUsername || "bot"})`
                      : t("telegramNotConfigured")}
                  </span>
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <TelegramConnectCard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
