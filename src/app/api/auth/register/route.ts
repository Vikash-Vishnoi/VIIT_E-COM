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
import { logAuthEvent } from '@/lib/audit';

export async function POST(req: NextRequest) { 
  try {
    await connectDB();
    // ── Parse body safely ────────────────────────────────────────────────────
    let email: any, otp: any, name: any, mobile: any, password: any;
    try {
      const body = await req.json();
      ({ email, otp, name, mobile, password } = body);
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid payload format' }, { status: 400 });
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ success: false, message: 'OTP is required and must be a string' }, { status: 400 });
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

    if (otpRecord.isLocked && otpRecord.lockedUntil && otpRecord.lockedUntil > new Date()) {
       return NextResponse.json({ success: false, message: 'Account locked due to too many OTP requests. Try again later.' }, { status: 400 });
    }

    // ── Check if the current OTP code is older than 5 minutes ───────────────
    const ageInMinutes = (Date.now() - otpRecord.createdAt.getTime()) / 60000;
    if (ageInMinutes > 5) {
      return NextResponse.json(
        { success: false, message: 'OTP has expired (valid for 5 minutes). Please request a new one.' }, 
        { status: 400 }
      );
    }

    // ── Brute-force guard: too many failed attempts for this code ────────────
    if (otpRecord.attempts >= 3) {
      return NextResponse.json(
        { success: false, message: 'Too many failed attempts for this code. Please request a new OTP.' },
        { status: 400 },
      );
    }

    // ── OTP value match (compare SHA-256 hashes) ─────────────────────────────
    if (otpRecord.otp !== hashOTP(otp)) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const attemptsLeft = 3 - otpRecord.attempts;
      if (attemptsLeft <= 0) {
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

    // ── Check if user already exists (Data Minimization) ────────────────────
    const existingUser = await User.findOne({ email: normalizedEmail }).select('_id');
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
      isVerified:   true,  // verified via OTP
      isActive:     true,
      lastLoginAt:  new Date(), // user is auto-logged in on registration
    });

    // ── Clean up used OTP ────────────────────────────────────────────────────
    await OTP.deleteOne({ _id: otpRecord._id });

    // ── Issue JWT and set HttpOnly cookie ────────────────────────────────────
    const token = await signToken({
      email:  normalizedEmail,
      name:   trimmedName,
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
      maxAge:   30 * 24 * 60 * 60, // 30 days
    });

    logAuthEvent(req, normalizedEmail, 'REGISTER');

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);

    // Mongoose required field validation error (e.g. blank name after trim)
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided. Please check your inputs and try again.' },
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
