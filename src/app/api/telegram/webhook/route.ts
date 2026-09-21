import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const update = await request.json() as any;

    if (update?.message) {
      const chatId = update.message.chat?.id;
      const text = (update.message.text || "").trim();

      if (chatId) {
        let env: Partial<CloudflareEnv> | undefined;
        try {
          const ctx = getCloudflareContext();
          env = ctx.env;
        } catch {
          // Non-Cloudflare fallback
        }

        const replyMessage =
          `🎯 <b>Welcome to Checkpoint!</b>\n\n` +
          `Your Telegram Chat ID is:\n<code>${chatId}</code>\n\n` +
          `Use this Chat ID in your Checkpoint settings or reminder forms to receive instant milestone and goal notifications.`;

        await sendTelegramMessage(env, chatId, replyMessage);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true }); // Always acknowledge to Telegram
  }
}
