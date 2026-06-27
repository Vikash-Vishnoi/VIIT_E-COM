import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { User } from '@/models';
import { connectDB } from '@/lib/db';

/**
 * Extracts and verifies the JWT from the request cookies.
 * Looks up the user by email (since userId is no longer in the payload for security reasons),
 * and returns the user's ObjectId as a string if valid and active.
 */
export async function getAuthUser(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || typeof payload.email !== 'string') return null;

  await connectDB();
  const user = await User.findOne({ email: payload.email }).select('_id isActive');
  
  if (!user || !user.isActive) return null;

  return user._id.toString();
}
