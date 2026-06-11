export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const passwordErrorMsg = "Password must be at least 8 characters, and include an uppercase letter, a lowercase letter, a number, and a special character.";

export function validatePassword(password: string): boolean {
  return passwordRegex.test(password);
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
