"use client";

import * as React from "react";
import * as jalaali from "jalaali-js";
import { useLocale } from "next-intl";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettings, type CalendarType } from "@/lib/settings-context";

export interface CustomDatePickerProps {
  value?: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  onChange: (val: string) => void;
  withTime?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const JALALI_MONTHS_FA = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const JALALI_MONTHS_EN = [
  "Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar",
  "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"
];

const GREGORIAN_MONTHS_FA = [
  "ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
  "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"
];

const GREGORIAN_MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Weekday headers:
// For Jalali, week starts on Saturday (شنبه): ش, ی, د, س, چ, پ, ج
const JALALI_WEEKDAYS_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const JALALI_WEEKDAYS_EN = ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];

// For Gregorian, week starts on Sunday: Su, Mo, Tu, We, Th, Fr, Sa
const GREGORIAN_WEEKDAYS_FA = ["ی", "د", "س", "چ", "پ", "ج", "ش"];
const GREGORIAN_WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad2(num: number): string {
  return num.toString().padStart(2, "0");
}

export function CustomDatePicker({
  value,
  onChange,
  withTime = false,
  disabled = false,
  placeholder,
  className,
}: CustomDatePickerProps) {
  const locale = useLocale();
  const isFa = locale === "fa";
  const { calendarType: globalCalendarType } = useSettings();

  // Allow local override inside the picker
  const [localCalendar, setLocalCalendar] = React.useState<CalendarType>(globalCalendarType);
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setLocalCalendar(globalCalendarType);
  }, [globalCalendarType]);

  // Parse existing value or default to now
  const parsedDate = React.useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // View state: current viewed year & month
  const [viewYear, setViewYear] = React.useState<number>(() => {
    const d = parsedDate || new Date();
    if (localCalendar === "jalali") {
      return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate()).jy;
    }
    return d.getFullYear();
  });

  const [viewMonth, setViewMonth] = React.useState<number>(() => {
    const d = parsedDate || new Date();
    if (localCalendar === "jalali") {
      return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate()).jm;
    }
    return d.getMonth() + 1; // 1-12
  });

  // Time state: HH:mm
  const [timeState, setTimeState] = React.useState<string>(() => {
    if (value && withTime) {
      const parts = value.split("T");
      if (parts[1]) {
        return parts[1].slice(0, 5);
      }
    }
    const now = new Date();
    return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  });

  // Keep view year/month in sync if calendar type switches
  const switchCalendar = (newType: CalendarType) => {
    setLocalCalendar(newType);
    const d = parsedDate || new Date();
    if (newType === "jalali") {
      const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      setViewYear(j.jy);
      setViewMonth(j.jm);
    } else {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth() + 1);
    }
  };

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Select day handler
  const handleSelectDay = (day: number) => {
    let gregYear: number;
    let gregMonth: number;
    let gregDay: number;

    if (localCalendar === "jalali") {
      const g = jalaali.toGregorian(viewYear, viewMonth, day);
      gregYear = g.gy;
      gregMonth = g.gm;
      gregDay = g.gd;
    } else {
      gregYear = viewYear;
      gregMonth = viewMonth;
      gregDay = day;
    }

    const dateStr = `${gregYear}-${pad2(gregMonth)}-${pad2(gregDay)}`;
    if (withTime) {
      onChange(`${dateStr}T${timeState || "09:00"}`);
    } else {
      onChange(dateStr);
    }

    if (!withTime) {
      setIsOpen(false);
    }
  };

  // Handle time change
  const handleTimeChange = (newTime: string) => {
    setTimeState(newTime);
    if (value) {
      const datePart = value.split("T")[0];
      onChange(`${datePart}T${newTime}`);
    }
  };

  // Format display text for input trigger
  const formattedDisplay = React.useMemo(() => {
    if (!parsedDate) return "";

    if (localCalendar === "jalali") {
      const j = jalaali.toJalaali(
        parsedDate.getFullYear(),
        parsedDate.getMonth() + 1,
        parsedDate.getDate()
      );
      const monthName = isFa ? JALALI_MONTHS_FA[j.jm - 1] : JALALI_MONTHS_EN[j.jm - 1];
      const datePart = `${j.jd} ${monthName} ${j.jy}`;
      if (withTime) {
        const timePart = `${pad2(parsedDate.getHours())}:${pad2(parsedDate.getMinutes())}`;
        return `${datePart} - ${timePart}`;
      }
      return datePart;
    } else {
      const monthName = isFa
        ? GREGORIAN_MONTHS_FA[parsedDate.getMonth()]
        : GREGORIAN_MONTHS_EN[parsedDate.getMonth()];
      const datePart = `${parsedDate.getDate()} ${monthName} ${parsedDate.getFullYear()}`;
      if (withTime) {
        const timePart = `${pad2(parsedDate.getHours())}:${pad2(parsedDate.getMinutes())}`;
        return `${datePart} - ${timePart}`;
      }
      return datePart;
    }
  }, [parsedDate, localCalendar, isFa, withTime]);

  // Compute days matrix for current viewMonth/viewYear
  const calendarGrid = React.useMemo(() => {
    if (localCalendar === "jalali") {
      const daysInMonth = jalaali.jalaaliMonthLength(viewYear, viewMonth);
      // Day of week of 1st day of Jalali month
      const firstDayGreg = jalaali.toGregorian(viewYear, viewMonth, 1);
      const jsDay = new Date(firstDayGreg.gy, firstDayGreg.gm - 1, firstDayGreg.gd).getDay();
      // In Iranian calendar: Saturday = 0, Sunday = 1, ..., Friday = 6
      const startOffset = (jsDay + 1) % 7;

      const cells: Array<{ day: number; currentMonth: boolean }> = [];
      for (let i = 0; i < startOffset; i++) {
        cells.push({ day: 0, currentMonth: false });
      }
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, currentMonth: true });
      }
      return cells;
    } else {
      const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
      const startOffset = new Date(viewYear, viewMonth - 1, 1).getDay(); // Sunday = 0

      const cells: Array<{ day: number; currentMonth: boolean }> = [];
      for (let i = 0; i < startOffset; i++) {
        cells.push({ day: 0, currentMonth: false });
      }
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, currentMonth: true });
      }
      return cells;
    }
  }, [viewYear, viewMonth, localCalendar]);

  // Check if a cell day is selected
  const isDaySelected = (day: number) => {
    if (!parsedDate || day === 0) return false;
    if (localCalendar === "jalali") {
      const j = jalaali.toJalaali(
        parsedDate.getFullYear(),
        parsedDate.getMonth() + 1,
        parsedDate.getDate()
      );
      return j.jy === viewYear && j.jm === viewMonth && j.jd === day;
    } else {
      return (
        parsedDate.getFullYear() === viewYear &&
        parsedDate.getMonth() + 1 === viewMonth &&
        parsedDate.getDate() === day
      );
    }
  };

  // Check if a cell day is today
  const isDayToday = (day: number) => {
    if (day === 0) return false;
    const now = new Date();
    if (localCalendar === "jalali") {
      const j = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      return j.jy === viewYear && j.jm === viewMonth && j.jd === day;
    } else {
      return (
        now.getFullYear() === viewYear &&
        now.getMonth() + 1 === viewMonth &&
        now.getDate() === day
      );
    }
  };

  const monthLabel = React.useMemo(() => {
    if (localCalendar === "jalali") {
      return isFa ? JALALI_MONTHS_FA[viewMonth - 1] : JALALI_MONTHS_EN[viewMonth - 1];
    }
    return isFa ? GREGORIAN_MONTHS_FA[viewMonth - 1] : GREGORIAN_MONTHS_EN[viewMonth - 1];
  }, [localCalendar, viewMonth, isFa]);

  const weekdays = React.useMemo(() => {
    if (localCalendar === "jalali") {
      return isFa ? JALALI_WEEKDAYS_FA : JALALI_WEEKDAYS_EN;
    }
    return isFa ? GREGORIAN_WEEKDAYS_FA : GREGORIAN_WEEKDAYS_EN;
  }, [localCalendar, isFa]);

  const handleSelectToday = () => {
    const now = new Date();
    const gregYear = now.getFullYear();
    const gregMonth = now.getMonth() + 1;
    const gregDay = now.getDate();

    if (localCalendar === "jalali") {
      const j = jalaali.toJalaali(gregYear, gregMonth, gregDay);
      setViewYear(j.jy);
      setViewMonth(j.jm);
    } else {
      setViewYear(gregYear);
      setViewMonth(gregMonth);
    }

    const dateStr = `${gregYear}-${pad2(gregMonth)}-${pad2(gregDay)}`;
    if (withTime) {
      onChange(`${dateStr}T${timeState || "09:00"}`);
    } else {
      onChange(dateStr);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          disabled && "cursor-not-allowed opacity-50",
          !formattedDisplay && "text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 shrink-0 text-primary" />
          <span className="truncate">
            {formattedDisplay ||
              placeholder ||
              (isFa ? "انتخاب تاریخ..." : "Select date...")}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {formattedDisplay && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title={isFa ? "پاک کردن" : "Clear"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Popover dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1.5 start-0 w-[300px] sm:w-[320px] rounded-2xl border border-outline-variant/40 bg-surface-container-highest/95 p-3 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Calendar type toggle strip */}
          <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-outline-variant/30">
            <span className="text-xs text-muted-foreground font-medium">
              {isFa ? "نوع تقویم:" : "Calendar:"}
            </span>
            <div className="inline-flex rounded-full bg-surface-container p-0.5 border border-outline-variant/30 text-xs">
              <button
                type="button"
                onClick={() => switchCalendar("jalali")}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer",
                  localCalendar === "jalali"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isFa ? "جلالی (شمسی)" : "Jalali"}
              </button>
              <button
                type="button"
                onClick={() => switchCalendar("gregorian")}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer",
                  localCalendar === "gregorian"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isFa ? "میلادی" : "Gregorian"}
              </button>
            </div>
          </div>

          {/* Month / Year header navigation */}
          <div className="flex items-center justify-between gap-2 mb-3 px-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full cursor-pointer"
              onClick={handlePrevMonth}
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Button>

            <span className="font-semibold text-sm select-none">
              {monthLabel} {viewYear}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full cursor-pointer"
              onClick={handleNextMonth}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekdays.map((wd, i) => (
              <span
                key={i}
                className="text-[11px] font-semibold text-muted-foreground/80 py-0.5 select-none"
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarGrid.map((cell, idx) => {
              if (cell.day === 0) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }
              const selected = isDaySelected(cell.day);
              const today = isDayToday(cell.day);

              return (
                <button
                  key={`day-${cell.day}`}
                  type="button"
                  onClick={() => handleSelectDay(cell.day)}
                  className={cn(
                    "h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs transition-all cursor-pointer",
                    selected
                      ? "bg-primary text-primary-foreground font-bold shadow-xs scale-105"
                      : today
                      ? "border border-primary text-primary font-semibold hover:bg-primary/10"
                      : "hover:bg-surface-container font-normal text-foreground"
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Time Picker section if withTime is true */}
          {withTime && (
            <div className="mt-3 pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{isFa ? "ساعت:" : "Time:"}</span>
              </div>
              <input
                type="time"
                value={timeState}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-surface-container text-xs font-mono text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-3 pt-2.5 border-t border-outline-variant/30 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectToday}
              className="h-7 text-xs rounded-full cursor-pointer px-2.5"
            >
              {isFa ? "امروز" : "Today"}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-7 text-xs rounded-full cursor-pointer px-3 gap-1"
            >
              <Check className="w-3 h-3" />
              <span>{isFa ? "تأیید" : "Done"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
