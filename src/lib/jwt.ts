import { SignJWT, jwtVerify } from 'jose';

// ── Guard: fail fast if JWT_SECRET is missing in production ──────────────────
const rawSecret = process.env.JWT_SECRET;

if (!rawSecret && process.env.NODE_ENV === 'production') {
  throw new Error(
    '[jwt] JWT_SECRET environment variable is not set. ' +
    'Set it in your .env.production / deployment config before starting the server.',
  );
}

if (!rawSecret) {
  console.warn(
    '⚠️  [jwt] JWT_SECRET is not set — using an insecure fallback. ' +
    'This is only acceptable in local development.',
  );
}

const JWT_SECRET = new TextEncoder().encode(
  rawSecret ?? 'fallback-super-secret-key-change-in-production',
);

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
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
