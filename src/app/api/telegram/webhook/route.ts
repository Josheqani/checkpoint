import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { telegramConnections } from "@/db/schema";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const update = (await request.json()) as any;

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

        if (text.startsWith("/start")) {
          const startParam = text.replace("/start", "").trim();

          if (startParam) {
            try {
              const db = getDb();
              const [conn] = await db
                .select()
                .from(telegramConnections)
                .where(eq(telegramConnections.token, startParam))
                .limit(1);

              if (conn && conn.status === "pending") {
                const username =
                  update.message.chat?.username ||
                  update.message.from?.username ||
                  null;
                const firstName =
                  update.message.chat?.first_name ||
                  update.message.from?.first_name ||
                  null;

                await db
                  .update(telegramConnections)
                  .set({
                    chatId: String(chatId),
                    username,
                    firstName,
                    status: "connected",
                  })
                  .where(eq(telegramConnections.token, startParam));

                const replyMessage =
                  `🎉 <b>تبریک ${firstName ? firstName + " عزیز" : ""}!</b>\n\n` +
                  `حساب تلگرام شما با موفقیت به برنامه <b>چک‌پوینت (Checkpoint)</b> متصل شد.\n\n` +
                  `می‌توانید به برنامه بازگردید. هشدارهای اهداف و یادآورهای شما از این پس در اینجا ارسال خواهند شد. ✅`;

                await sendTelegramMessage(env, chatId, replyMessage);
                return NextResponse.json({ ok: true });
              }
            } catch (dbErr) {
              console.error("Error matching telegram connection token:", dbErr);
            }
          }
        }

        // Default /start reply or fallback
        const replyMessage =
          `🎯 <b>به چک‌پوینت خوش آمدید!</b>\n\n` +
          `برای اتصال خودکار حساب خود، روی دکمه «اتصال به تلگرام» داخل برنامه کلیک کنید.\n\n` +
          `شناسه عددی چت شما:\n<code>${chatId}</code>`;

        await sendTelegramMessage(env, chatId, replyMessage);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true }); // Always acknowledge to Telegram
  }
}
