import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User, OTP } from '@/models';
import { signToken } from '@/lib/jwt';
import {
  validatePassword, passwordErrorMsg,
  validateEmail,    emailErrorMsg,
  validateMobile,   mobileErrorMsg,
  validateName,     nameErrorMsg,
  hashOTP,
} from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    // ── Parse body safely ────────────────────────────────────────────────────
    let email: string | undefined, otp: string | undefined,
        name: string | undefined, mobile: string | undefined,
        password: string | undefined;
    
    try {
      const body = await req.json();
      ({ email, otp, name, mobile, password } = body);
    } catch {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    // ── Presence check ───────────────────────────────────────────────────────
    if (!email || !otp || !name || !mobile || !password) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    // ── Type check ───────────────────────────────────────────────────────────
    if (
      typeof email    !== 'string' ||
      typeof otp      !== 'string' ||
      typeof name     !== 'string' ||
      typeof mobile   !== 'string' ||
      typeof password !== 'string'
    ) {
      return NextResponse.json({ success: false, message: 'Invalid payload format' }, { status: 400 });
    }

    // ── Format validations ───────────────────────────────────────────────────
    if (!validateEmail(email)) {
      return NextResponse.json({ success: false, message: emailErrorMsg }, { status: 400 });
    }

    if (!validateName(name)) {
      return NextResponse.json({ success: false, message: nameErrorMsg }, { status: 400 });
    }

    if (!validateMobile(mobile)) {
      return NextResponse.json({ success: false, message: mobileErrorMsg }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ success: false, message: passwordErrorMsg }, { status: 400 });
    }

    // Normalize
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName     = name.trim();
    const trimmedMobile   = mobile.trim();

    // ── OTP lookup ───────────────────────────────────────────────────────────
    const otpRecord = await OTP.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'OTP has expired or was not sent. Please request a new one.' },
        { status: 400 },
      );
    }

    // ── Brute-force guard: too many failed attempts ───────────────────────────
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { success: false, message: 'Too many failed attempts. For security, this OTP has been invalidated. Please request a new one.' },
        { status: 400 },
      );
    }

    // ── OTP value match (compare SHA-256 hashes) ─────────────────────────────
    if (otpRecord.otp !== hashOTP(otp)) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const attemptsLeft = 3 - otpRecord.attempts;
      if (attemptsLeft <= 0) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return NextResponse.json(
          { success: false, message: 'Too many failed attempts. Please request a new OTP.' },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { success: false, message: `Invalid OTP. You have ${attemptsLeft} attempt(s) left.` },
        { status: 400 },
      );
    }

    // ── Check email not already registered ───────────────────────────────────
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email is already registered' },
        { status: 400 },
      );
    }

    // ── Hash password ────────────────────────────────────────────────────────
    const salt         = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // ── Create user ──────────────────────────────────────────────────────────
    await User.create({
      name:         trimmedName,
      email:        normalizedEmail,
      mobile:       trimmedMobile,
      passwordHash,
      role:         'customer',
      isVerified:   true,  // verified via OTP
      isActive:     true,
    });

    // ── Clean up used OTP ────────────────────────────────────────────────────
    await OTP.deleteOne({ _id: otpRecord._id });

    // ── Issue JWT and set HttpOnly cookie ────────────────────────────────────
    const newUser = await User.findOne({ email: normalizedEmail }).lean();
    const token = await signToken({
      userId: (newUser!._id as any).toString(),
      email:  newUser!.email,
      role:   newUser!.role,
      name:   newUser!.name,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Registration successful! You are now logged in.',
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);

    // Mongoose required field validation error (e.g. blank name after trim)
    if (error.name === 'ValidationError') {
      const firstMsg = Object.values(error.errors)[0] as any;
      return NextResponse.json(
        { success: false, message: firstMsg?.message ?? 'Validation error' },
        { status: 400 },
      );
    }

    // MongoDB duplicate key (race condition: same email/mobile registered twice)
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      const message =
        duplicateField === 'mobile'
          ? 'This mobile number is already registered.'
          : `This ${duplicateField} is already in use.`;
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: 'Registration failed' }, { status: 500 });
  }
}
