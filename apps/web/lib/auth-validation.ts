const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = /^\d{6}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export function normalizeOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function isValidOtp(value: string): boolean {
  return OTP_PATTERN.test(value);
}

export function maskEmail(value: string): string {
  const [localPart, domain] = normalizeEmail(value).split("@");
  if (!localPart || !domain) return "akun email";
  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"•".repeat(Math.max(2, Math.min(6, localPart.length - visible.length)))}@${domain}`;
}
