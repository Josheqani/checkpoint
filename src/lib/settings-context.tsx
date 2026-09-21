"use client";

import * as React from "react";
import { useLocale } from "next-intl";

export type CalendarType = "jalali" | "gregorian";

export interface SettingsContextType {
  calendarType: CalendarType;
  setCalendarType: (type: CalendarType) => void;
  defaultPhoneNumber: string;
  setDefaultPhoneNumber: (phone: string) => void;
  defaultTelegramChatId: string;
  setDefaultTelegramChatId: (chatId: string) => void;
  isLoaded: boolean;
}

const SettingsContext = React.createContext<SettingsContextType>({
  calendarType: "jalali",
  setCalendarType: () => {},
  defaultPhoneNumber: "",
  setDefaultPhoneNumber: () => {},
  defaultTelegramChatId: "",
  setDefaultTelegramChatId: () => {},
  isLoaded: false,
});

export const CALENDAR_STORAGE_KEY = "checkpoint_calendar_type";
export const DEFAULT_PHONE_STORAGE_KEY = "checkpoint_default_phone";
export const DEFAULT_TELEGRAM_STORAGE_KEY = "checkpoint_default_telegram_chat_id";

export function SettingsProvider({
  children,
  locale: propLocale,
}: {
  children: React.ReactNode;
  locale?: string;
}) {
  let activeLocale = propLocale || "fa";
  try {
    const intlLocale = useLocale();
    if (intlLocale) activeLocale = intlLocale;
  } catch {
    // Graceful fallback if rendered outside NextIntlClientProvider
  }

  const defaultCalendar: CalendarType = activeLocale === "fa" ? "jalali" : "gregorian";

  const [calendarType, setCalendarTypeState] = React.useState<CalendarType>(defaultCalendar);
  const [defaultPhoneNumber, setDefaultPhoneNumberState] = React.useState<string>("");
  const [defaultTelegramChatId, setDefaultTelegramChatIdState] = React.useState<string>("");
  const [isLoaded, setIsLoaded] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      const savedCal = localStorage.getItem(CALENDAR_STORAGE_KEY) as CalendarType | null;
      if (savedCal === "jalali" || savedCal === "gregorian") {
        setCalendarTypeState(savedCal);
      } else {
        setCalendarTypeState(defaultCalendar);
      }

      const savedPhone = localStorage.getItem(DEFAULT_PHONE_STORAGE_KEY);
      if (savedPhone) {
        setDefaultPhoneNumberState(savedPhone);
      }

      const savedTelegram = localStorage.getItem(DEFAULT_TELEGRAM_STORAGE_KEY);
      if (savedTelegram) {
        setDefaultTelegramChatIdState(savedTelegram);
      }
    } catch {
      // localStorage might be unavailable
    } finally {
      setIsLoaded(true);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === CALENDAR_STORAGE_KEY && (e.newValue === "jalali" || e.newValue === "gregorian")) {
        setCalendarTypeState(e.newValue);
      }
      if (e.key === DEFAULT_PHONE_STORAGE_KEY && e.newValue !== null) {
        setDefaultPhoneNumberState(e.newValue);
      }
      if (e.key === DEFAULT_TELEGRAM_STORAGE_KEY && e.newValue !== null) {
        setDefaultTelegramChatIdState(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [defaultCalendar]);

  const setCalendarType = React.useCallback((type: CalendarType) => {
    setCalendarTypeState(type);
    try {
      localStorage.setItem(CALENDAR_STORAGE_KEY, type);
    } catch {
      // ignore
    }
  }, []);

  const setDefaultPhoneNumber = React.useCallback((phone: string) => {
    setDefaultPhoneNumberState(phone);
    try {
      localStorage.setItem(DEFAULT_PHONE_STORAGE_KEY, phone);
    } catch {
      // ignore
    }
  }, []);

  const setDefaultTelegramChatId = React.useCallback((chatId: string) => {
    setDefaultTelegramChatIdState(chatId);
    try {
      localStorage.setItem(DEFAULT_TELEGRAM_STORAGE_KEY, chatId);
    } catch {
      // ignore
    }
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        calendarType,
        setCalendarType,
        defaultPhoneNumber,
        setDefaultPhoneNumber,
        defaultTelegramChatId,
        setDefaultTelegramChatId,
        isLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return React.useContext(SettingsContext);
}
