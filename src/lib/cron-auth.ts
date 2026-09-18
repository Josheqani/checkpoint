import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Constant-time string equality check to prevent timing attacks.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.byteLength !== bufB.byteLength) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i] ^ bufB[i];
  }
  return diff === 0;
}

/**
 * Retrieves the configured CRON_SECRET from Cloudflare environment bindings
 * or process.env fallback.
 */
export function getCronSecret(): string {
  try {
    const { env } = getCloudflareContext();
    if (env.CRON_SECRET) {
      return env.CRON_SECRET;
    }
  } catch {
    // Fallback for local development or non-Cloudflare environments
  }
  return process.env.CRON_SECRET || "";
}

/**
 * Validates an Authorization header against the expected CRON_SECRET using
 * constant-time comparison to prevent timing attacks.
 */
export function verifyCronAuth(
  authHeader: string | null | undefined,
  expectedSecret?: string
): boolean {
  const secret = expectedSecret ?? getCronSecret();
  if (!secret || !authHeader) {
    return false;
  }

  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) {
    return false;
  }

  const token = authHeader.slice(prefix.length).trim();
  if (!token) {
    return false;
  }

  return constantTimeEqual(token, secret);
}

/**
 * Helper to verify authorization directly from an incoming Request.
 */
export function verifyCronRequest(
  request: Request,
  expectedSecret?: string
): boolean {
  return verifyCronAuth(request.headers.get("authorization"), expectedSecret);
}
