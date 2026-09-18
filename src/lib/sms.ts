/**
 * ============================================================================
 * sms.ir REST API v1 Integration Summary:
 * ============================================================================
 * - Base URL: https://api.sms.ir/v1
 * - Authentication: Passed via HTTP request header `X-API-KEY: <api_key>`
 * - Headers: `Content-Type: application/json`, `Accept: application/json`
 * - Endpoint for Custom SMS: POST https://api.sms.ir/v1/send/bulk
 * - Payload structure:
 *     {
 *       "lineNumber": number | string,  // Required: sender line number registered on sms.ir
 *       "messageText": string,          // Required: text message content
 *       "mobiles": string[],            // Required: array of destination phone numbers (e.g. ["09123456789"])
 *       "sendDateTime": null            // Optional: null for immediate delivery
 *     }
 * - Line discovery endpoint:
 *     GET https://api.sms.ir/v1/line
 *     Returns: { "status": 1, "message": "موفق", "data": [lineNumber1, ...] }
 *     If SMSIR_LINE_NUMBER is not provided in env, the wrapper queries this endpoint
 *     to automatically discover and use the primary line associated with the account.
 * - Response format:
 *     Success: { "status": 1, "message": "موفق", "data": [messageId, ...] }
 *     Error: { "status": 0, "message": "..." } or standard HTTP 4xx/5xx codes
 * - Rate limits: Standard REST API limits (HTTP 429), max 100 mobile numbers per bulk request.
 * ============================================================================
 */

export interface SendSmsResult {
  success: boolean;
  error?: string;
  messageId?: number | string;
}

/**
 * Normalizes an Iranian mobile number to the standard 11-digit "09XXXXXXXXX" format.
 * Examples:
 *   "+989123456789" -> "09123456789"
 *   "00989123456789" -> "09123456789"
 *   "0912 345 6789" -> "09123456789"
 */
export function normalizeIranianMobile(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, "");
  if (cleaned.startsWith("+98")) {
    return "0" + cleaned.slice(3);
  }
  if (cleaned.startsWith("0098")) {
    return "0" + cleaned.slice(4);
  }
  return cleaned;
}

/**
 * Sends a single SMS message using the sms.ir v1 REST API.
 * This function is fully Workers-compatible (pure fetch) and guarantees not to throw uncaught exceptions.
 * 
 * @param env Cloudflare environment bindings (optional if process.env is populated)
 * @param phoneNumber Destination mobile number (Iranian format, e.g. 09XXXXXXXXX or +989XXXXXXXXX)
 * @param message The SMS text body to deliver
 */
export async function sendSms(
  env: Partial<CloudflareEnv> | undefined,
  phoneNumber: string,
  message: string
): Promise<SendSmsResult> {
  try {
    const apiKey = env?.SMSIR_API_KEY || process.env.SMSIR_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "SMSIR_API_KEY secret is not configured",
      };
    }

    const normalizedMobile = normalizeIranianMobile(phoneNumber);
    if (!/^09\d{9}$/.test(normalizedMobile)) {
      return {
        success: false,
        error: `Invalid destination mobile number: "${phoneNumber}"`,
      };
    }

    // Determine line number
    let lineNumber = env?.SMSIR_LINE_NUMBER || process.env.SMSIR_LINE_NUMBER;

    if (!lineNumber) {
      // Auto-discover line number from account
      try {
        const lineResponse = await fetch("https://api.sms.ir/v1/line", {
          method: "GET",
          headers: {
            "X-API-KEY": apiKey,
            Accept: "application/json",
          },
        });

        if (lineResponse.ok) {
          const lineData = (await lineResponse.json().catch(() => null)) as {
            status?: number;
            data?: Array<number | string>;
          } | null;

          if (lineData?.status === 1 && Array.isArray(lineData.data) && lineData.data.length > 0) {
            lineNumber = lineData.data[0];
          }
        }
      } catch (err) {
        console.warn("Failed to auto-discover sms.ir line number:", err);
      }
    }

    if (!lineNumber) {
      return {
        success: false,
        error: "No sender line number configured or available on the sms.ir account",
      };
    }

    const payload = {
      lineNumber: isNaN(Number(lineNumber)) ? lineNumber : Number(lineNumber),
      messageText: message,
      mobiles: [normalizedMobile],
      sendDateTime: null,
    };

    const response = await fetch("https://api.sms.ir/v1/send/bulk", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return {
        success: false,
        error: `sms.ir HTTP error ${response.status}: ${errText || response.statusText}`,
      };
    }

    const json = (await response.json().catch(() => null)) as {
      status?: number;
      message?: string;
      data?: Array<number | string>;
    } | null;

    if (json?.status === 1) {
      const messageId = Array.isArray(json.data) && json.data.length > 0 ? json.data[0] : undefined;
      return {
        success: true,
        messageId,
      };
    }

    return {
      success: false,
      error: json?.message || "sms.ir rejected the SMS request",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error while sending SMS",
    };
  }
}
