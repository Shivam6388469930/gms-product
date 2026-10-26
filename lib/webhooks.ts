import crypto from "crypto";

export type WebhookEvent =
  | "respondent.complete"
  | "respondent.screenout"
  | "respondent.quota_full"
  | "project.complete"
  | "project.soft_launch_paused"
  | "project.cpi_updated";

export type WebhookConfig = {
  event: WebhookEvent;
  url: string;
  secret: string;
  active: boolean;
};

/**
 * Signs a webhook payload with HMAC-SHA256.
 */
function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

/**
 * Dispatch a webhook event to all matching registered URLs.
 *
 * This is fire-and-forget with a single retry on failure.
 * In production you'd use a proper queue (Bull, SQS, etc.).
 */
export async function dispatchWebhooks(
  webhooks: WebhookConfig[],
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const matching = webhooks.filter(
    (wh) => wh.event === event && wh.active
  );

  if (!matching.length) return;

  const payload = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data,
  });

  for (const wh of matching) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": event,
    };

    if (wh.secret) {
      headers["X-Signature"] = signPayload(payload, wh.secret);
    }

    // Fire-and-forget with retry
    sendWithRetry(wh.url, payload, headers).catch((err) => {
      console.error(`Webhook delivery failed for ${wh.url}:`, err);
    });
  }
}

async function sendWithRetry(
  url: string,
  payload: string,
  headers: Record<string, string>,
  retries = 2,
  delayMs = 1000
): Promise<void> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: payload,
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) return;

      console.warn(
        `Webhook ${url} returned ${res.status} on attempt ${attempt + 1}`
      );
    } catch (err) {
      console.warn(
        `Webhook ${url} failed on attempt ${attempt + 1}:`,
        err
      );
    }

    if (attempt < retries) {
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs * Math.pow(2, attempt))
      );
    }
  }
}
