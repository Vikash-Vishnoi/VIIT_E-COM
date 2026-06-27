import crypto from 'crypto';

// ─── Password ─────────────────────────────────────────────────────────────────
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/;
export const passwordErrorMsg =
  'Password must be between 8 and 20 characters, and include an uppercase letter, a lowercase letter, a number, and a special character.';

export function validatePassword(password: any): boolean {
  if (!password || typeof password !== 'string') return false;
  if (password.length > 20) return false;
  return passwordRegex.test(password);
}

// ─── Email ────────────────────────────────────────────────────────────────────
// RFC-5322 simplified — catches the vast majority of invalid formats
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,255}$/;
export const emailErrorMsg = 'Please enter a valid email address.';

export function validateEmail(email: any): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 255) return false;
  return emailRegex.test(email.trim());
}

// ─── Mobile ───────────────────────────────────────────────────────────────────
const mobileRegex = /^\+91[0-9]{10}$/;
export const mobileErrorMsg = 'Please enter a valid 10-digit mobile number.';

export function validateMobile(mobile: any): boolean {
  if (!mobile || typeof mobile !== 'string') return false;
  const trimmed = mobile.trim();
  if (trimmed.length !== 13) return false;
  return mobileRegex.test(trimmed);
}

// ─── Name ─────────────────────────────────────────────────────────────────────
export const nameErrorMsg = 'Name must be between 2 and 100 characters and cannot be blank.';

export function validateName(name: any): boolean {
  if (!name || typeof name !== 'string') return false;
  if (name.length > 100) return false;
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
