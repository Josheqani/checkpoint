/**
 * Telegram Bot API Integration
 * Pure fetch implementation compatible with Cloudflare Workers runtime.
 */

export interface SendTelegramResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export interface TelegramBotInfoResult {
  ok: boolean;
  botUsername?: string;
  botFirstName?: string;
  error?: string;
}

/**
 * Returns the Telegram Bot token from Cloudflare environment or process.env fallback.
 */
export function getTelegramBotToken(env?: Partial<CloudflareEnv>): string {
  return env?.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
}

/**
 * Retrieves basic information about the configured Telegram Bot using getMe.
 */
export async function getTelegramBotInfo(
  env?: Partial<CloudflareEnv>
): Promise<TelegramBotInfoResult> {
  const token = getTelegramBotToken(env);
  if (!token) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = (await res.json()) as {
      ok: boolean;
      description?: string;
      result?: {
        id: number;
        is_bot: boolean;
        first_name: string;
        username?: string;
      };
    };

    if (!data.ok || !data.result) {
      return { ok: false, error: data.description || "Failed to fetch bot info" };
    }

    return {
      ok: true,
      botUsername: data.result.username,
      botFirstName: data.result.first_name,
    };
  } catch (err: any) {
    return { ok: false, error: err.message || "Network error fetching bot info" };
  }
}

/**
 * Sends a message to a Telegram chat or channel.
 */
export async function sendTelegramMessage(
  env: Partial<CloudflareEnv> | undefined,
  chatId: string | number,
  message: string,
  options?: { parseMode?: "HTML" | "Markdown" }
): Promise<SendTelegramResult> {
  const token = getTelegramBotToken(env);
  if (!token) {
    return { success: false, error: "TELEGRAM_BOT_TOKEN is not configured" };
  }

  const cleanChatId = String(chatId).trim();
  if (!cleanChatId) {
    return { success: false, error: "Missing destination Telegram Chat ID" };
  }

  try {
    const parseMode = options?.parseMode ?? "HTML";
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: message,
        parse_mode: parseMode,
      }),
    });

    const data = (await res.json()) as {
      ok: boolean;
      description?: string;
      result?: {
        message_id: number;
      };
    };

    if (!data.ok) {
      return {
        success: false,
        error: data.description || `Telegram API responded with HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      messageId: data.result?.message_id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error sending Telegram message",
    };
  }
}

/**
 * Automatically registers or verifies the webhook URL with Telegram.
 */
export async function setTelegramWebhook(
  env: Partial<CloudflareEnv> | undefined,
  webhookUrl: string
): Promise<{ ok: boolean; error?: string }> {
  const token = getTelegramBotToken(env);
  if (!token) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });

    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      return { ok: false, error: data.description || "Failed to set webhook" };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Network error setting webhook" };
  }
}

