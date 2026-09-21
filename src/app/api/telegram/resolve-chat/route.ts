import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { resolveTelegramChat } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId || !chatId.trim()) {
      return NextResponse.json(
        { error: "chatId query parameter is required" },
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

    const result = await resolveTelegramChat(env, chatId.trim());

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Could not resolve chat" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      ok: true,
      username: result.username || null,
      firstName: result.firstName || null,
      lastName: result.lastName || null,
    });
  } catch (err: any) {
    console.error("GET /api/telegram/resolve-chat error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to resolve chat" },
      { status: 500 }
    );
  }
}
