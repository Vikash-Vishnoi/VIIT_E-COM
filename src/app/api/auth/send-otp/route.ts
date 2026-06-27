import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { validateEmail, emailErrorMsg } from '@/lib/validation';
import { handleOTPGenerationAndSend } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ── Parse body safely ────────────────────────────────────────────────────
    let email: any;
    try { 
      const body = await req.json();
      email = body.email;
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid payload format' }, { status: 400 });
    }


    // ── Validate email format ────────────────────────────────────────────────
    if (!validateEmail(email)) {
      return NextResponse.json({ success: false, message: emailErrorMsg }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Check if user already exists ─────────────────────────────────────────
    const existingUser = await User.findOne({ email: normalizedEmail }).select('_id');
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email is already registered. Please login.' },
        { status: 400 },
      );
    }

    const result = await handleOTPGenerationAndSend(normalizedEmail);
    return NextResponse.json(
      { success: result.success, message: result.message },
      { status: result.status }
    );
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
  }
}
