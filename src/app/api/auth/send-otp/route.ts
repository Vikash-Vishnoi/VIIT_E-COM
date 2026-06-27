import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, OTP } from '@/models';
import { sendOTP } from '@/lib/mail';
import { validateEmail, emailErrorMsg, hashOTP } from '@/lib/validation';

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
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email is already registered. Please login.' },
        { status: 400 },
      );
    }

    // ── Rate limiting & Lockout ──────────────────────────────────────────────
    let existingOtp = await OTP.findOne({ email: normalizedEmail });
    if (existingOtp) {
      // 1. Check if completely locked out
      if (existingOtp.isLocked && existingOtp.lockedUntil && existingOtp.lockedUntil > new Date()) {
        const remainingMins = Math.ceil((existingOtp.lockedUntil.getTime() - Date.now()) / 60000);
        return NextResponse.json(
          { success: false, message: `Maximum attempts reached. Please try again after ${remainingMins} minutes.` },
          { status: 429 },
        );
      }

      // 2. Check 60-second cooldown
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

      // 3. Check if max sends reached (3 total sends)
      if (existingOtp.sendCount >= 3) {
        existingOtp.isLocked = true;
        existingOtp.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 mins
        existingOtp.createdAt = new Date(); // Reset TTL timer so it doesn't get deleted during the lock
        await existingOtp.save();
        return NextResponse.json(
          { success: false, message: 'Maximum attempts reached. Please try again after 30 minutes.' },
          { status: 429 },
        );
      }
    }

    // ── Generate 5-digit OTP ─────────────────────────────────────────────────
    const plainOtp = Math.floor(10000 + Math.random() * 90000).toString();
    const hashedOtp = hashOTP(plainOtp);

    if (existingOtp) {
      existingOtp.otp = hashedOtp;
      existingOtp.attempts = 0; // Reset validation attempts for the new code
      existingOtp.sendCount += 1;
      existingOtp.createdAt = new Date(); // Update time to enforce the 60s cooldown next time, and for 5-minute validity check
      await existingOtp.save();
    } else {
      await OTP.create({ email: normalizedEmail, otp: hashedOtp, sendCount: 1 });
    }

    // ── Send plaintext OTP via email (never stored in DB) ────────────────────
    await sendOTP(normalizedEmail, plainOtp);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
  }
}
