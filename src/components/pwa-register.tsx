"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sparkles, RefreshCw, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaRegister() {
  const t = useTranslations("pwa");
  const [waitingWorker, setWaitingWorker] = React.useState<ServiceWorker | null>(null);
  const waitingWorkerRef = React.useRef<ServiceWorker | null>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  const setWorker = React.useCallback((worker: ServiceWorker | null) => {
    waitingWorkerRef.current = worker;
    setWaitingWorker(worker);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;
    // Reload page only once when new service worker takes over
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    const applyUpdate = (worker?: ServiceWorker | null) => {
      setIsUpdating(true);
      const target = worker || waitingWorkerRef.current;
      if (target) {
        target.postMessage({ type: "SKIP_WAITING" });
      }
      // Safety timeout: if controllerchange doesn't fire within 2s, force reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    };

    const triggerToastNotification = (worker: ServiceWorker) => {
      toast.info(t("updateAvailable"), {
        id: "pwa-update-toast",
        description: t("updateDescription"),
        duration: Infinity,
        action: {
          label: t("updateNow"),
          onClick: () => applyUpdate(worker),
        },
      });
    };

    const onUpdateFound = (registration: ServiceWorkerRegistration) => {
      // If there is already a worker waiting (e.g. from previous load)
      if (registration.waiting) {
        setWorker(registration.waiting);
        setShowPrompt(true);
        triggerToastNotification(registration.waiting);
        return;
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          // If a controller already exists, this is a genuine update (not first install)
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWorker(newWorker);
            setShowPrompt(true);
            triggerToastNotification(newWorker);
          }
        });
      });
    };

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("[PWA] ServiceWorker registered with scope:", registration.scope);

        onUpdateFound(registration);

        // Check for updates when user returns to tab / app
        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        };

        const handleFocus = () => {
          registration.update().catch(() => {});
        };

        const handleOnline = () => {
          registration.update().catch(() => {});
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("online", handleOnline);

        // Periodic check every 45 minutes
        const intervalId = window.setInterval(() => {
          registration.update().catch(() => {});
        }, 45 * 60 * 1000);

        return () => {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          window.removeEventListener("focus", handleFocus);
          window.removeEventListener("online", handleOnline);
          window.clearInterval(intervalId);
        };
      } catch (error) {
        console.warn("[PWA] ServiceWorker registration failed:", error);
      }
    };

    // If document is already loaded, register immediately; otherwise wait for load
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW, { once: true });
    }

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [t, setWorker]);

  const handleUpdate = () => {
    setIsUpdating(true);
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    toast.dismiss("pwa-update-toast");
  };

  // If there's no waiting update, render nothing
  if (!waitingWorker) {
    return null;
  }

  // If user dismissed the prompt card, show a subtle floating badge/pill so they can still update anytime
  if (dismissed && !showPrompt) {
    return (
      <aside
        aria-label="PWA Update Available"
        className="fixed bottom-20 end-4 sm:bottom-6 sm:end-6 z-50 animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          onClick={() => setShowPrompt(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:opacity-95 transition-all text-xs font-medium cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t("updateReadyBadge")}</span>
        </button>
      </aside>
    );
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <aside
      aria-label="PWA Update Notification"
      role="alert"
      className="fixed bottom-20 start-4 end-4 sm:start-auto sm:end-6 sm:bottom-6 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="bg-card text-card-foreground border border-outline-variant/60 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl bg-card/95 flex flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base leading-snug">
                {t("updateAvailable")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {t("updateDescription")}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            disabled={isUpdating}
            className="text-xs h-8 px-3"
          >
            {t("later")}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="text-xs h-8 px-4 gap-1.5 font-medium shadow-xs"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t("updating")}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t("updateNow")}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
