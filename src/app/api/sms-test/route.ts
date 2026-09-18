import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendSms } from "@/lib/sms";
import { phoneNumberSchema } from "@/lib/validations/reminder";
import { z } from "zod";

export const dynamic = "force-dynamic";

const smsTestSchema = z.object({
  phoneNumber: phoneNumberSchema,
  message: z.string().min(1, "Message cannot be empty").max(500),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const parsed = smsTestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    let env: CloudflareEnv | undefined;
    try {
      env = getCloudflareContext().env;
    } catch {
      // Fallback for non-Cloudflare environments
    }

    const result = await sendSms(
      env,
      parsed.data.phoneNumber,
      parsed.data.message
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: "SMS sent successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process SMS test request",
      },
      { status: 500 }
    );
  }
}
