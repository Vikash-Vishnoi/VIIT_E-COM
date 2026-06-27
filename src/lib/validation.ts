import crypto from 'crypto';

// ─── Password ─────────────────────────────────────────────────────────────────
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const passwordErrorMsg =
  'Password must be at least 8 characters, and include an uppercase letter, a lowercase letter, a number, and a special character.';

export function validatePassword(password: string): boolean {
  return passwordRegex.test(password);
}

// ─── Email ────────────────────────────────────────────────────────────────────
// RFC-5322 simplified — catches the vast majority of invalid formats
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const emailErrorMsg = 'Please enter a valid email address.';

export function validateEmail(email: string): boolean {
  return emailRegex.test(email.trim());
}

// ─── Mobile ───────────────────────────────────────────────────────────────────
// Accepts optional leading + and 7–15 digits (E.164 compatible)
const mobileRegex = /^\+?[0-9]{7,15}$/;
export const mobileErrorMsg = 'Please enter a valid mobile number (7–15 digits).';

export function validateMobile(mobile: string): boolean {
  return mobileRegex.test(mobile.trim());
}

// ─── Name ─────────────────────────────────────────────────────────────────────
export const nameErrorMsg = 'Name must be at least 2 characters and cannot be blank.';

export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}

// ─── OTP hashing ──────────────────────────────────────────────────────────────
/**
 * One-way SHA-256 hash of a plaintext OTP.
 * Store the hash; compare by hashing the incoming value.
 */
export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// ─── RegExp escaping (used in search) ────────────────────────────────────────
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
