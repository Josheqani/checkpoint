import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getTelegramBotInfo } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET() {
  let env: Partial<CloudflareEnv> | undefined;
  try {
    const ctx = getCloudflareContext();
    env = ctx.env;
  } catch {
    // Non-Cloudflare fallback
  }

  const info = await getTelegramBotInfo(env);

  return NextResponse.json({
    isConfigured: info.ok,
    botUsername: info.botUsername || null,
    botFirstName: info.botFirstName || null,
    error: info.error || null,
  });
}
