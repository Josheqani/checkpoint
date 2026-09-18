export interface SessionPayload {
  username: string;
  exp: number; // unix timestamp in ms
}

export const SESSION_COOKIE_NAME = "checkpoint_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function createSessionToken(
  payload: SessionPayload,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const payloadJson = JSON.stringify(payload);
  const encodedPayload = uint8ArrayToBase64Url(encoder.encode(payloadJson));

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload)
  );
  const encodedSignature = uint8ArrayToBase64Url(new Uint8Array(signature));

  return `${encodedPayload}.${encodedSignature}`;
}

export async function verifySessionToken(
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: SessionPayload }> {
  try {
    if (!token || !secret) {
      return { valid: false };
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false };
    }

    const [encodedPayload, encodedSignature] = parts;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBytes = base64UrlToUint8Array(encodedSignature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(encodedPayload)
    );

    if (!isValid) {
      return { valid: false };
    }

    const payloadBytes = base64UrlToUint8Array(encodedPayload);
    const decoder = new TextDecoder();
    const payload = JSON.parse(decoder.decode(payloadBytes)) as SessionPayload;

    if (!payload.exp || payload.exp <= Date.now()) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}
