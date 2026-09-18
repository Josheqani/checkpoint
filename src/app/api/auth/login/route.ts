import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      username?: unknown;
      password?: unknown;
    } | null;

    if (
      !body ||
      typeof body.username !== "string" ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const { username, password } = body;

    let env: CloudflareEnv | undefined;
    try {
      env = getCloudflareContext().env;
    } catch {
      // Fallback for non-Cloudflare environments
    }

    const expectedUsername = env?.AUTH_USERNAME || process.env.AUTH_USERNAME;
    const expectedPasswordHash =
      env?.AUTH_PASSWORD_HASH || process.env.AUTH_PASSWORD_HASH;
    const sessionSecret = env?.SESSION_SECRET || process.env.SESSION_SECRET;

    if (!expectedUsername || !expectedPasswordHash || !sessionSecret) {
      console.error("Missing authentication environment variables");
      return NextResponse.json(
        { error: "Server authentication misconfigured" },
        { status: 500 }
      );
    }

    const isUsernameMatch = username === expectedUsername;
    // Always perform bcrypt comparison to prevent timing attacks
    const isPasswordMatch = await bcrypt.compare(
      password,
      isUsernameMatch
        ? expectedPasswordHash
        : "$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghijklmnopqrstuv"
    );

    if (!isUsernameMatch || !isPasswordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
    const token = await createSessionToken({ username, exp }, sessionSecret);

    const response = NextResponse.json({
      success: true,
      message: "Authenticated successfully",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }
}
