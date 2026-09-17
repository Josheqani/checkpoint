import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cloud, Cpu, Globe, Palette } from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              className="dark:invert h-7 w-[130px]"
              src="/next.svg"
              alt="Next.js logo"
              width={130}
              height={26}
              priority
            />
            <Badge variant="outline" className="text-xs">
              OpenNext + Workers
            </Badge>
          </div>
          <Badge variant="secondary" className="text-xs font-mono">
            {locale.toUpperCase()}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t("title")}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {t("description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                <Cloud className="w-5 h-5 text-sky-500 shrink-0" />
                <span className="text-sm font-medium">
                  {t("features.cloudflare")}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                <Cpu className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-sm font-medium">
                  {t("features.opennext")}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                <Palette className="w-5 h-5 text-purple-500 shrink-0" />
                <span className="text-sm font-medium">
                  {t("features.shadcn")}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                <Globe className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium">
                  {t("features.bilingual")}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button>{t("buttons.default")}</Button>
              <Button variant="secondary">{t("buttons.secondary")}</Button>
              <Button variant="outline">{t("buttons.outline")}</Button>
              <Button variant="destructive">{t("buttons.destructive")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
