"use client";

import * as React from "react";
import * as jalaali from "jalaali-js";
import { useLocale } from "next-intl";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RotateCcw,
} from "lucide-react";
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
  "Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrival",
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
  const [placement, setPlacement] = React.useState<"bottom" | "top" | "modal">("bottom");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setLocalCalendar(globalCalendarType);
  }, [globalCalendarType]);

  // Compute smart placement so the popover action buttons are never cut off by screen edges
  React.useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (typeof window === "undefined") return;

      // Mobile screens or tight vertical heights use centered modal presentation
      if (window.innerWidth < 640 || window.innerHeight < 620) {
        setPlacement("modal");
        return;
      }

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const popoverHeight = withTime ? 420 : 380;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        // If not enough room below, open above
        if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
          setPlacement("top");
        } else {
          setPlacement("bottom");
        }
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, withTime]);

  // Parse existing value or null
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
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        (!popoverRef.current || !popoverRef.current.contains(event.target as Node))
      ) {
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
      const firstDayGreg = jalaali.toGregorian(viewYear, viewMonth, 1);
      const jsDay = new Date(firstDayGreg.gy, firstDayGreg.gm - 1, firstDayGreg.gd).getDay();
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
      const startOffset = new Date(viewYear, viewMonth - 1, 1).getDay();

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

  // Popover calendar content
  const renderCalendarContent = () => (
    <div className="space-y-3 select-none">
      {/* Calendar type toggle strip */}
      <div className="flex items-center justify-between gap-1 pb-2 border-b border-outline-variant/30">
        <span className="text-xs text-muted-foreground font-medium">
          {isFa ? "تقویم:" : "Calendar:"}
        </span>
        <div className="inline-flex rounded-full bg-surface-container p-0.5 border border-outline-variant/40 text-xs">
          <button
            type="button"
            onClick={() => switchCalendar("jalali")}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer",
              localCalendar === "jalali"
                ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isFa ? "جلالی (شمسی)" : "Jalali"}
          </button>
          <button
            type="button"
            onClick={() => switchCalendar("gregorian")}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer",
              localCalendar === "gregorian"
                ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isFa ? "میلادی" : "Gregorian"}
          </button>
        </div>
      </div>

      {/* Month / Year header navigation */}
      <div className="flex items-center justify-between gap-2 px-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full cursor-pointer hover:bg-surface-container-highest text-foreground"
          onClick={handlePrevMonth}
        >
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </Button>

        <span className="font-semibold text-sm tracking-tight text-foreground">
          {monthLabel} {viewYear}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full cursor-pointer hover:bg-surface-container-highest text-foreground"
          onClick={handleNextMonth}
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((wd, i) => (
          <span
            key={i}
            className="text-[11px] font-semibold text-muted-foreground/80 py-1"
          >
            {wd}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarGrid.map((cell, idx) => {
          if (cell.day === 0) {
            return <div key={`empty-${idx}`} className="h-8 w-8" />;
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
                  : "hover:bg-surface-container-highest font-normal text-foreground"
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Time Picker section if withTime is true */}
      {withTime && (
        <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{isFa ? "ساعت:" : "Time:"}</span>
          </div>
          <input
            type="time"
            value={timeState}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="h-8 px-2.5 rounded-xl border border-outline-variant/50 bg-surface-container text-xs font-mono text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          />
        </div>
      )}

      {/* Footer actions */}
      <div className="pt-2.5 border-t border-outline-variant/30 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectToday}
          className="h-7 text-xs rounded-full cursor-pointer px-3 border-outline-variant/40 hover:bg-surface-container"
        >
          {isFa ? "امروز" : "Today"}
        </Button>

        <div className="flex items-center gap-1.5">
          {formattedDisplay && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              className="h-7 text-xs rounded-full cursor-pointer px-2 text-muted-foreground hover:text-destructive"
            >
              {isFa ? "پاک کردن" : "Clear"}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-7 text-xs rounded-full cursor-pointer px-3 gap-1 bg-primary text-primary-foreground shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isFa ? "تأیید" : "Done"}</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Material Design 3 Input Trigger (matches standard MD3 text fields) */}
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
          "flex h-11 w-full items-center justify-between rounded-2xl border border-outline/50 bg-surface-container-lowest/60 px-4 py-2 text-base text-foreground transition-all duration-150 cursor-pointer select-none md:text-sm",
          "hover:border-outline-variant hover:bg-surface-container-lowest/90",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25",
          isOpen && "border-primary ring-2 ring-primary/25",
          disabled && "cursor-not-allowed opacity-40",
          !formattedDisplay && "text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
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
              className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title={isFa ? "پاک کردن" : "Clear"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Popover Presentation */}
      {isOpen && (
        <>
          {placement === "modal" ? (
            /* Centered Modal Backdrop on Mobile or tight screens */
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
              <div
                ref={popoverRef}
                className="w-full max-w-[330px] rounded-3xl border border-outline-variant/30 bg-surface-container-high p-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
              >
                {renderCalendarContent()}
              </div>
            </div>
          ) : (
            /* Desktop Popover: flips top or bottom based on available screen space */
            <div
              ref={popoverRef}
              className={cn(
                "absolute z-50 start-0 w-[310px] sm:w-[330px] rounded-3xl border border-outline-variant/40 bg-surface-container-high p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150",
                placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
              )}
            >
              {renderCalendarContent()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
