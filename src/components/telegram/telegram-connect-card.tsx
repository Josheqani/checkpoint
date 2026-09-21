"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Send, Loader2, CheckCircle2, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings-context";

interface TelegramConnectCardProps {
  onConnected?: (chatId: string, username?: string) => void;
  showTestButton?: boolean;
}

export function TelegramConnectCard({
  onConnected,
  showTestButton = true,
}: TelegramConnectCardProps) {
  const locale = useLocale();
  const isFa = locale === "fa";

  const {
    defaultTelegramChatId,
    setDefaultTelegramChatId,
    defaultTelegramUsername,
    setDefaultTelegramUsername,
  } = useSettings();

  const [connecting, setConnecting] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [showManual, setShowManual] = React.useState(false);
  const [manualId, setManualId] = React.useState(defaultTelegramChatId);
  const pollTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setManualId(defaultTelegramChatId);
  }, [defaultTelegramChatId]);

  React.useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleStartConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/telegram/connect-session", { method: "POST" });
      const data = (await res.json()) as any;

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to start connection");
      }

      const { token, deepLink } = data;

      // Open Telegram deep link
      window.open(deepLink, "_blank", "noopener,noreferrer");

      let attempts = 0;
      const maxAttempts = 60; // 60 * 2s = 2 minutes timeout

      if (pollTimerRef.current) clearInterval(pollTimerRef.current);

      pollTimerRef.current = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setConnecting(false);
          toast.error(
            isFa
              ? "زمان اتصال به پایان رسید. لطفاً مجدداً امتحان کنید."
              : "Connection timed out. Please try again."
          );
          return;
        }

        try {
          const checkRes = await fetch(`/api/telegram/check-link?token=${token}`);
          const checkData = (await checkRes.json()) as any;

          if (checkData.connected && checkData.chatId) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setConnecting(false);

            setDefaultTelegramChatId(checkData.chatId);
            if (checkData.username) {
              setDefaultTelegramUsername(checkData.username);
            }

            onConnected?.(checkData.chatId, checkData.username);

            toast.success(
              isFa
                ? `✅ تلگرام با موفقیت متصل شد! ${
                    checkData.username ? `(@${checkData.username})` : ""
                  }`
                : `✅ Telegram connected successfully! ${
                    checkData.username ? `(@${checkData.username})` : ""
                  }`
            );
          }
        } catch {
          // Keep polling until timeout
        }
      }, 2000);
    } catch (err: any) {
      setConnecting(false);
      toast.error(err.message || "Error connecting to Telegram");
    }
  };

  const handleCancelConnect = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setConnecting(false);
  };

  const handleDisconnect = () => {
    setDefaultTelegramChatId("");
    setDefaultTelegramUsername("");
    toast.success(isFa ? "اتصال تلگرام قطع شد" : "Telegram disconnected");
  };

  const handleTest = async () => {
    if (!defaultTelegramChatId) return;
    setTesting(true);
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: defaultTelegramChatId }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed");
      }
      toast.success(
        isFa
          ? "پیام تست ارسال شد! تلگرام خود را بررسی کنید."
          : "Test message sent! Check your Telegram."
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to send test message");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualId.trim();
    if (!clean) return;
    setDefaultTelegramChatId(clean);
    onConnected?.(clean, defaultTelegramUsername);
    setShowManual(false);
    toast.success(isFa ? "شناسه تلگرام ذخیره شد" : "Telegram Chat ID saved");
  };

  // 1. If already connected
  if (defaultTelegramChatId) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <span>{isFa ? "تلگرام متصل است" : "Telegram Connected"}</span>
                {defaultTelegramUsername && (
                  <span className="text-xs text-sky-600 dark:text-sky-400 font-mono font-medium">
                    @{defaultTelegramUsername}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Chat ID: {defaultTelegramChatId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showTestButton && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={testing}
                onClick={handleTest}
                className="h-8 text-xs cursor-pointer gap-1 bg-surface border-emerald-500/30 hover:bg-emerald-500/10"
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-sky-500" />
                )}
                <span>{isFa ? "تست ارسال" : "Test"}</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              {isFa ? "قطع اتصال" : "Disconnect"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. If connecting (waiting for START)
  if (connecting) {
    return (
      <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-5 h-5 animate-spin text-sky-500 shrink-0" />
            <div>
              <div className="font-semibold text-sm text-foreground">
                {isFa
                  ? "در انتظار زدن دکمه Start در تلگرام..."
                  : "Waiting for Start in Telegram..."}
              </div>
              <p className="text-xs text-muted-foreground">
                {isFa
                  ? "تلگرام باز شد. لطفاً در ربات دکمه Start را بزنید تا حسابتان خودکار متصل شود."
                  : "Telegram opened. Tap Start in the bot to automatically link your account."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancelConnect}
            className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // 3. Not connected: 1-Click Connect Button
  return (
    <div className="p-4 rounded-2xl bg-surface border border-outline-variant/40 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
            <Send className="w-4 h-4 text-sky-500" />
            <span>{isFa ? "اتصال ۱-کلیکی به تلگرام" : "1-Click Telegram Connection"}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isFa
              ? "روی دکمه زیر کلیک کنید و در تلگرام Start را بزنید؛ حسابتان فوراً متصل می‌شود بدون نیاز به کپی کردن شناسه."
              : "Click the button below and tap Start in Telegram; no need to manually copy or paste your Chat ID."}
          </p>
        </div>

        <Button
          type="button"
          onClick={handleStartConnect}
          className="gap-2 bg-sky-500 hover:bg-sky-600 text-white shadow-xs cursor-pointer shrink-0 h-10 px-4 font-medium"
        >
          <Send className="w-4 h-4" />
          <span>{isFa ? "اتصال به تلگرام" : "Connect Telegram"}</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </Button>
      </div>

      {/* Manual toggle for edge cases */}
      <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setShowManual(!showManual)}
          className="text-[11px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
        >
          {showManual
            ? isFa
              ? "بستن ورود دستی"
              : "Hide manual entry"
            : isFa
            ? "تنظیم دستی Chat ID (اختیاری)"
            : "Manual Chat ID (optional)"}
        </button>
      </div>

      {showManual && (
        <form onSubmit={handleSaveManual} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            dir="ltr"
            placeholder="123456789"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            className="h-8 text-xs font-mono px-2.5 rounded-lg border border-outline-variant/40 bg-background flex-1"
          />
          <Button type="submit" size="sm" className="h-8 text-xs px-3 cursor-pointer">
            {isFa ? "ذخیره" : "Save"}
          </Button>
        </form>
      )}
    </div>
  );
}
