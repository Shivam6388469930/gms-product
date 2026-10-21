// lib/disposable-email.ts

const disposableDomains = new Set([
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "yopmail.com",
  "temp-mail.org",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email
    .toLowerCase()
    .trim()
    .split("@")[1];

  if (!domain) {
    return true;
  }

  return disposableDomains.has(domain);
}