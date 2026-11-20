export interface GeneratedRedirectUrls {
  entryUrl: string;
  completeUrl: string;
  disqualifiedUrl: string;
  terminateUrl: string;
  quotaUrl: string;
  securityTerminateUrl: string;
}

/**
 * Get the base URL of the currently running GMS application.
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }

  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";

  return envUrl.trim().replace(/\/+$/, "");
}

/**
 * Check whether a respondent value is a template
 * instead of a real respondent ID.
 */
export function isRespondentPlaceholder(
  value: string | null | undefined
): boolean {
  if (!value) {
    return true;
  }

  const raw = String(value).trim();

  if (!raw) {
    return true;
  }

  const normalized = raw
    .replace(/^['"]|['"]$/g, "")
    .trim()
    .toLowerCase();

  // Invalid literal values.
  const invalidKeywords = [
    "undefined",
    "null",
    "none",
    "nan",
    "[object object]",
    "empty",
  ];

  if (invalidKeywords.includes(normalized)) {
    return true;
  }

  // Any value with braces, brackets, or URL-encoded brackets is a template placeholder.
  if (
    normalized.includes("{") ||
    normalized.includes("}") ||
    normalized.includes("[") ||
    normalized.includes("]") ||
    normalized.includes("%7b") ||
    normalized.includes("%7d") ||
    normalized.includes("%5b") ||
    normalized.includes("%5d")
  ) {
    return true;
  }

  // Common placeholder tokens.
  const placeholderRegex =
    /^(?:\{\{?|\[\[?|\%7b\%7b?|\%5b\%5b?)(?:\s*)(?:respondent[\s_-]*id|respondent|rid|pid|uid|panel+ist[\s_-]*(?:id|identifier)?|id)(?:(?:\s*)\}\}?(?:$)|(?:\s*)\]\]?(?:$)|(?:\s*)\%7d\%7d?(?:$)|(?:\s*)\%5d\%5d?(?:$))/i;

  if (placeholderRegex.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Generate GMS integration URLs.
 *
 * The supplier/client system must replace:
 *
 * {respondentId}
 *
 * with the actual respondent ID.
 */
export function generateRedirectUrls(
  projectId: string,
  baseUrlOverride?: string
): GeneratedRedirectUrls {
  const base = (
    baseUrlOverride || getBaseUrl()
  )
    .trim()
    .replace(/\/+$/, "");

  const pid = encodeURIComponent(
    projectId || "{PROJECT_ID}"
  );

  const respondentPlaceholder = "{respondentId}";

  return {
    // Supplier sends respondent here.
    entryUrl:
      `${base}/api/survey/start` +
      `?pid=${pid}` +
      `&rid=${respondentPlaceholder}`,

    // Client sends respondent back here.
    completeUrl:
      `${base}/api/survey/redirect/complete` +
      `?pid=${pid}` +
      `&rid=${respondentPlaceholder}`,

    disqualifiedUrl:
      `${base}/api/survey/redirect/disqualified` +
      `?pid=${pid}` +
      `&rid=${respondentPlaceholder}`,

    terminateUrl:
      `${base}/api/survey/redirect/terminate` +
      `?pid=${pid}` +
      `&rid=${respondentPlaceholder}`,

    quotaUrl:
      `${base}/api/survey/redirect/quota` +
      `?pid=${pid}` +
      `&rid=${respondentPlaceholder}`,

    securityTerminateUrl:
      `${base}/api/survey/redirect/security` +
      `?pid=${pid}` +
      `&rid=${respondentPlaceholder}`,
  };
}

/**
 * Replace respondent/panelist placeholders inside a URL.
 */
export function replaceRespondentPlaceholder(
  url: string,
  respondentId: string
): string {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();

  const rid = String(
    respondentId || ""
  ).trim();

  if (!rid) {
    return trimmed;
  }

  const encodedRid =
    encodeURIComponent(rid);

  let result = trimmed;

  // =========================================================
  // 1. MULTI-WORD PANELIST / RESPONDENT IDENTIFIER
  // =========================================================

  result = result.replace(
    /\{\{\s*panel+ist(?:%20|\+|\s|_)+identifier\s*\}\}/gi,
    encodedRid
  );

  result = result.replace(
    /\{\s*panel+ist(?:%20|\+|\s|_)+identifier\s*\}/gi,
    encodedRid
  );

  result = result.replace(
    /\[\[\s*panel+ist(?:%20|\+|\s|_)+identifier\s*\]\]/gi,
    encodedRid
  );

  result = result.replace(
    /\[\s*panel+ist(?:%20|\+|\s|_)+identifier\s*\]/gi,
    encodedRid
  );

  result = result.replace(
    /%7B%7B\s*panel+ist(?:%20|\+|\s|_)+identifier\s*%7D%7D/gi,
    encodedRid
  );

  result = result.replace(
    /%7B\s*panel+ist(?:%20|\+|\s|_)+identifier\s*%7D/gi,
    encodedRid
  );

  result = result.replace(
    /%5B%5B\s*panel+ist(?:%20|\+|\s|_)+identifier\s*%5D%5D/gi,
    encodedRid
  );

  result = result.replace(
    /%5B\s*panel+ist(?:%20|\+|\s|_)+identifier\s*%5D/gi,
    encodedRid
  );

  // =========================================================
  // 2. STANDARD TOKENS (INCL. ID, RID, PID, UID, RESPONDENT, PANELIST)
  // =========================================================
  const tokenPattern =
    "(?:respondentId|respondentID|respondent_id|respondent|rid|RID|pid|PID|uid|UID|panel+istId|PANEL+IST_ID|panel+ist_id|panel+ist|id|ID)";

  result = result.replace(
    new RegExp(`\\{\\{\\s*${tokenPattern}\\s*\\}\\}`, "gi"),
    encodedRid
  );

  result = result.replace(
    new RegExp(`\\{\\s*${tokenPattern}\\s*\\}`, "gi"),
    encodedRid
  );

  result = result.replace(
    new RegExp(`\\[\\[\\s*${tokenPattern}\\s*\\]\\]`, "gi"),
    encodedRid
  );

  result = result.replace(
    new RegExp(`\\[\\s*${tokenPattern}\\s*\\]`, "gi"),
    encodedRid
  );

  // =========================================================
  // 3. URL-ENCODED BRACKET TOKENS (%7B = {, %7D = }, %5B = [, %5D = ])
  // =========================================================

  result = result.replace(
    new RegExp(`%7B%7B\\s*${tokenPattern}\\s*%7D%7D`, "gi"),
    encodedRid
  );

  result = result.replace(
    new RegExp(`%7B\\s*${tokenPattern}\\s*%7D`, "gi"),
    encodedRid
  );

  result = result.replace(
    new RegExp(`%5B%5B\\s*${tokenPattern}\\s*%5D%5D`, "gi"),
    encodedRid
  );

  result = result.replace(
    new RegExp(`%5B\\s*${tokenPattern}\\s*%5D`, "gi"),
    encodedRid
  );

  return result;
}

/**
 * Build the final client survey URL.
 *
 * Example:
 *
 * Input:
 * https://client.com/survey?pid=GMS82473&rid={respondentId}
 *
 * Output:
 * https://client.com/survey?pid=GMS82473&rid=TEST001
 */
export function buildClientSurveyUrl(
  surveyUrl: string,
  respondentId: string,
  paramName = "rid"
): string {
  if (
    !surveyUrl ||
    typeof surveyUrl !== "string"
  ) {
    return "";
  }

  const url = surveyUrl.trim();

  const rid = String(
    respondentId || ""
  ).trim();

  if (!rid) {
    return url;
  }

  const encodedRid =
    encodeURIComponent(rid);

  // =========================================================
  // 1. Replace placeholders
  // =========================================================

  const replaced =
    replaceRespondentPlaceholder(
      url,
      rid
    );

  if (replaced !== url) {
    return replaced;
  }

  // =========================================================
  // 2. Fill empty respondent parameter (e.g. &pid= or &rid=)
  // =========================================================

  const emptyParamRegex =
    /([?&](?:rid|respondent_?id|panel+ist_?id|panellist_?id|uid|pid)=)(?=&|$)/i;

  if (emptyParamRegex.test(url)) {
    return url.replace(
      emptyParamRegex,
      (match, p1) => `${p1}${encodedRid}`
    );
  }

  // =========================================================
  // 3. Add configured respondent parameter
  // =========================================================

  try {
    const parsed = new URL(url);

    parsed.searchParams.set(
      paramName || "rid",
      rid
    );

    return parsed.toString();
  } catch {
    // =======================================================
    // 4. Fallback for relative/invalid URLs
    // =======================================================

    const [beforeHash, hash] =
      url.split("#");

    const separator =
      beforeHash.includes("?")
        ? beforeHash.endsWith("?") ||
          beforeHash.endsWith("&")
          ? ""
          : "&"
        : "?";

    const result =
      `${beforeHash}${separator}` +
      `${encodeURIComponent(
        paramName || "rid"
      )}=${encodedRid}`;

    return hash !== undefined
      ? `${result}#${hash}`
      : result;
  }
}