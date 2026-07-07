import { NextRequest } from 'next/server';
import { connectDB } from './db';
import { AuthLog } from '@/models';

type AuthAction = 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'ACCOUNT_LOCKED' | 'REGISTER' | 'PASSWORD_CHANGED' | 'LOGOUT' | 'FORGOT_PASSWORD' | 'PASSWORD_RESET';

export const logAuthEvent = (req: NextRequest, email: string, action: AuthAction) => {
  // Fire and forget, we don't want to block the main response
  (async () => {
    try {
      await connectDB();
      const ipAddress = req.headers.get('x-forwarded-for') || 'Unknown';
      const userAgent = req.headers.get('user-agent') || 'Unknown';

      await AuthLog.create({
        email,
        action,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error(`[Audit Log Error] Failed to log ${action} for ${email}:`, error);
    }
  })();
};
