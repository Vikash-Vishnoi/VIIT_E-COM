import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, OTP } from '@/models';
import { sendOTP } from '@/lib/mail';
import { validateEmail, emailErrorMsg, hashOTP } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ── Parse body safely ────────────────────────────────────────────────────
    let email: string | undefined;
    try {
      const body = await req.json();
      email = body.email;
    } catch {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    if (typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid payload format' }, { status: 400 });
    }

    // ── Validate email format ────────────────────────────────────────────────
    if (!validateEmail(email)) {
      return NextResponse.json({ success: false, message: emailErrorMsg }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Check if user already exists ─────────────────────────────────────────
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email is already registered. Please login.' },
        { status: 400 },
      );
    }

    // ── Rate limiting: 60-second cooldown per email ──────────────────────────
    const existingOtp = await OTP.findOne({ email: normalizedEmail });
    if (existingOtp) {
      const diffInSeconds = (Date.now() - existingOtp.createdAt.getTime()) / 1000;
      if (diffInSeconds < 60) {
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${Math.ceil(60 - diffInSeconds)} seconds before requesting a new OTP.`,
          },
          { status: 429 },
        );
      }
    }

    // ── Generate 5-digit OTP ─────────────────────────────────────────────────
    const plainOtp = Math.floor(10000 + Math.random() * 90000).toString();

    // ── Delete any existing OTPs for this email, then save hashed OTP ────────
    await OTP.deleteMany({ email: normalizedEmail });
    await OTP.create({ email: normalizedEmail, otp: hashOTP(plainOtp) });

    // ── Send plaintext OTP via email (never stored in DB) ────────────────────
    await sendOTP(normalizedEmail, plainOtp);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
  }
}
