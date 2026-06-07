import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        name: payload.name
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Authentication error' }, { status: 500 });
  }
}
