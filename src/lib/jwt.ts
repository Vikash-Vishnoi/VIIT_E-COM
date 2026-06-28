import { SignJWT, jwtVerify } from 'jose';

// ── Guard: fail fast if JWT secret is missing in production ──────────────────
const rawSecret = process.env.JWT_SECRET;

if (!rawSecret && process.env.NODE_ENV === 'production') {
  throw new Error(
    '[jwt] JWT secret environment variable is not set. ' +
    'Set it in your .env.production / deployment config before starting the server.',
  );
}

if (!rawSecret) {
  console.warn(
    '[jwt] JWT secret is not set — using an insecure fallback. ' +
    'This is only acceptable in local development.',
  );
}

const JWT_SECRET = new TextEncoder().encode(
  rawSecret ?? 'fallback-super-secret-key-change-in-production',
);

// Used for regular customers — 30-day session for good UX
export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

// Used for admin users only — short-lived 8h session to limit blast radius of stolen tokens
export async function signAdminToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}
