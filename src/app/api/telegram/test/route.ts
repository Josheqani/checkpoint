import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId } = body as { chatId?: string };

    if (!chatId || String(chatId).trim() === "") {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    let env: Partial<CloudflareEnv> | undefined;
    try {
      const ctx = getCloudflareContext();
      env = ctx.env;
    } catch {
      // Non-Cloudflare fallback
    }

    const testMessage = `🎯 <b>Checkpoint Test Notification</b>\n\nYour Telegram is successfully connected to Checkpoint! You will receive milestone alerts and goal reminders here.`;

    const result = await sendTelegramMessage(env, chatId, testMessage);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send Telegram test message" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
