import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { telegramConnections } from "@/db/schema";
import { getTelegramBotInfo, setTelegramWebhook } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let env: Partial<CloudflareEnv> | undefined;
    try {
      const ctx = getCloudflareContext();
      env = ctx.env;
    } catch {
      // Non-Cloudflare fallback
    }

    const botInfo = await getTelegramBotInfo(env);
    if (!botInfo.ok || !botInfo.botUsername) {
      return NextResponse.json(
        { error: botInfo.error || "Telegram bot is not configured" },
        { status: 400 }
      );
    }

    // Automatically ensure webhook is registered
    const origin = new URL(request.url).origin;
    const webhookUrl = `${origin}/api/telegram/webhook`;
    await setTelegramWebhook(env, webhookUrl).catch(() => {});

    // Generate unique session token
    const token = "chk_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const db = getDb();
    await db.insert(telegramConnections).values({
      token,
      status: "pending",
      expiresAt,
      createdAt: new Date(),
    });

    const deepLink = `https://t.me/${botInfo.botUsername}?start=${token}`;

    return NextResponse.json({
      success: true,
      token,
      botUsername: botInfo.botUsername,
      deepLink,
    });
  } catch (err: any) {
    console.error("POST /api/telegram/connect-session error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create connection session" },
      { status: 500 }
    );
  }
}
