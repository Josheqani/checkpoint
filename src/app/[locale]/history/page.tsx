"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Target,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface SentLogItem {
  id: string;
  reminderId: string;
  phoneNumber: string;
  status: "sent" | "delivered" | "failed" | string;
  errorCode: string | null;
  sentAt: string | number | Date;
  goalId: string | null;
  goalTitle: string | null;
  scheduleType: string | null;
}

export default function HistoryPage() {
  const t = useTranslations("history");
  const locale = useLocale();

  const [items, setItems] = useState<SentLogItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (offset = 0, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const res = await fetch(`/api/history?limit=50&offset=${offset}`);
        if (!res.ok) {
          throw new Error("Failed to fetch SMS history");
        }
        const data = (await res.json()) as {
          success?: boolean;
          history?: SentLogItem[];
          totalCount?: number;
          hasMore?: boolean;
        };

        if (data.success && Array.isArray(data.history)) {
          if (append) {
            setItems((prev) => [...prev, ...(data.history || [])]);
          } else {
            setItems(data.history);
          }
          setTotalCount(data.totalCount ?? 0);
          setHasMore(Boolean(data.hasMore));
        } else {
          if (!append) setItems([]);
          setTotalCount(0);
          setHasMore(false);
        }
      } catch {
        setError(t("fetchError"));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchHistory(0, false);
  }, [fetchHistory]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchHistory(items.length, true);
    }
  };

  const formatSentDate = (dateVal: string | number | Date) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Tehran",
        hour12: false,
      }).format(d);
    } catch {
      return "";
    }
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
              {t("title")}
            </h1>
            {!loading && (
              <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5">
                {totalCount}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchHistory(0, false)}
          disabled={loading}
          className="gap-2 rounded-full h-10 px-4 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="text-xs font-medium">{t("retry")}</span>
        </Button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 py-3 border-b border-outline-variant/15 last:border-0"
            >
              <Skeleton className="h-5 w-1/4 rounded-lg" />
              <Skeleton className="h-4 w-1/6 rounded-lg hidden sm:block" />
              <Skeleton className="h-4 w-1/5 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-1/6 rounded-lg hidden md:block" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-[28px] border border-destructive/25 bg-destructive/10 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-destructive font-medium">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHistory(0, false)}
            className="rounded-full cursor-pointer"
          >
            {t("retry")}
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-[28px] border border-dashed border-outline-variant/40 bg-surface-container-lowest">
          <div className="w-14 h-14 rounded-2xl bg-surface-container text-muted-foreground flex items-center justify-center mb-4">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-medium text-foreground">{t("emptyTitle")}</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1 leading-relaxed">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop & Tablet Table View */}
          <div className="hidden sm:block rounded-3xl border border-outline-variant/30 bg-surface-container-low overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-surface-container-high/60">
                <TableRow className="border-outline-variant/30 hover:bg-transparent">
                  <TableHead className="font-semibold text-xs text-foreground/80 ps-5">
                    {t("table.goalTitle")}
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-foreground/80">
                    {t("table.phoneNumber")}
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-foreground/80">
                    {t("table.sentAt")}
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-foreground/80">
                    {t("table.status")}
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-foreground/80 pe-5">
                    {t("table.details")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isSent = item.status === "sent" || item.status === "delivered";
                  return (
                    <TableRow
                      key={item.id}
                      className="border-outline-variant/20 hover:bg-surface-container/50 transition-colors"
                    >
                      {/* Goal Title */}
                      <TableCell className="font-medium text-sm ps-5">
                        {item.goalId ? (
                          <Link
                            href={`/goals/${item.goalId}`}
                            className="hover:text-primary transition-colors hover:underline inline-flex items-center gap-1.5"
                          >
                            <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate max-w-[220px]">
                              {item.goalTitle || t("table.deletedGoal")}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground italic">
                            {t("table.deletedGoal")}
                          </span>
                        )}
                      </TableCell>

                      {/* Phone Number */}
                      <TableCell className="font-mono text-xs text-foreground/90">
                        {item.phoneNumber}
                      </TableCell>

                      {/* Sent Date & Time (Tehran) */}
                      <TableCell className="text-xs text-muted-foreground">
                        {formatSentDate(item.sentAt)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {isSent ? (
                          <Badge
                            variant="default"
                            className="gap-1 rounded-full text-[11px] font-semibold bg-emerald-600/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-0"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t(`table.${item.status}` as any) || item.status}</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="gap-1 rounded-full text-[11px] font-semibold border-0"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>{t("table.failed")}</span>
                          </Badge>
                        )}
                      </TableCell>

                      {/* Details / Error */}
                      <TableCell className="pe-5 text-xs">
                        {isSent ? (
                          <span className="text-muted-foreground/80">
                            {t("table.successDetail")}
                          </span>
                        ) : (
                          <span className="text-destructive font-mono text-[11px] break-all">
                            {item.errorCode || "Delivery failed"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card-Based List View (< 640px) */}
          <div className="sm:hidden space-y-3">
            {items.map((item) => {
              const isSent = item.status === "sent" || item.status === "delivered";
              return (
                <Card
                  key={item.id}
                  className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {item.goalId ? (
                        <Link
                          href={`/goals/${item.goalId}`}
                          className="font-medium text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <Target className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">
                            {item.goalTitle || t("table.deletedGoal")}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {t("table.deletedGoal")}
                        </span>
                      )}
                    </div>
                    {isSent ? (
                      <Badge
                        variant="default"
                        className="gap-1 rounded-full text-[10px] font-semibold bg-emerald-600/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-0 shrink-0"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t(`table.${item.status}` as any) || item.status}</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="gap-1 rounded-full text-[10px] font-semibold border-0 shrink-0"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>{t("table.failed")}</span>
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t border-outline-variant/20">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-muted-foreground/70" />
                      <span className="font-mono">{item.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground/70" />
                      <span>{formatSentDate(item.sentAt)}</span>
                    </div>
                    {!isSent && item.errorCode && (
                      <p className="text-destructive font-mono text-[11px] pt-1">
                        {item.errorCode}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-full px-6 h-10 gap-2 cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("loadingMore")}</span>
                  </>
                ) : (
                  <span>{t("loadMore")}</span>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
