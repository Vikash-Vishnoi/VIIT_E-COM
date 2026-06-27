import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { logAuthEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    // Attempt to identify the user for audit logging
    const token = req.cookies.get('auth_token')?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload && typeof payload.email === 'string') {
        logAuthEvent(req, payload.email, 'LOGOUT');
      }
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear the auth_token cookie by setting it with maxAge 0
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, 
    });

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, message: 'Failed to log out' }, { status: 500 });
  }
}
