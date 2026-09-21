import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const update = (await request.json()) as any;

    if (update?.message) {
      const chatId = update.message.chat?.id;
      const firstName = update.message.chat?.first_name || update.message.from?.first_name || "User";

      if (chatId) {
        let env: Partial<CloudflareEnv> | undefined;
        try {
          const ctx = getCloudflareContext();
          env = ctx.env;
        } catch {
          // Non-Cloudflare fallback
        }

        const replyMessage =
          `🎯 <b>Welcome to Checkpoint, ${firstName}!</b>\n\n` +
          `Your Telegram Chat ID is:\n` +
          `<code>${chatId}</code>\n\n` +
          `Copy this number and paste it in your <b>Checkpoint Settings</b> under <i>Telegram Notifications</i> to enable milestone & goal reminders.\n\n` +
          `شناسه عددی چت شما:\n<code>${chatId}</code>\n` +
          `این عدد را در بخش تنظیمات چک‌پوینت وارد کنید.`;

        await sendTelegramMessage(env, chatId, replyMessage);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}
