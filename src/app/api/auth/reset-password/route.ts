import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User, OTP } from '@/models';
import { signToken } from '@/lib/jwt';
import { validatePassword, passwordErrorMsg, validateEmail, emailErrorMsg, hashOTP } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    let email: string | undefined, otp: string | undefined, newPassword: string | undefined;
    try {
      const body = await req.json();
      ({ email, otp, newPassword } = body);
    } catch {
      return NextResponse.json({ success: false, message: 'Email, OTP and new password are required' }, { status: 400 });
    }


    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    if (typeof email !== 'string' || typeof otp !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid payload format' }, { status: 400 });
    }


    if (!validateEmail(email)) {
      return NextResponse.json({ success: false, message: emailErrorMsg }, { status: 400 });
    }

    if (!validatePassword(newPassword)) {
      return NextResponse.json({ success: false, message: passwordErrorMsg }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the OTP record
    const otpRecord = await OTP.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      return NextResponse.json({ success: false, message: 'OTP has expired or was not sent. Please request a new one.' }, { status: 400 });
    }

    if (otpRecord.isLocked && otpRecord.lockedUntil && otpRecord.lockedUntil > new Date()) {
       return NextResponse.json({ success: false, message: 'Account locked due to too many OTP requests. Try again later.' }, { status: 400 });
    }

    // Check if the current OTP code is older than 5 minutes
    const ageInMinutes = (Date.now() - otpRecord.createdAt.getTime()) / 60000;
    if (ageInMinutes > 5) {
      return NextResponse.json({ success: false, message: 'OTP has expired (valid for 5 minutes). Please request a new one.' }, { status: 400 });
    }

    // Check for brute-force attempts on the code
    if (otpRecord.attempts >= 3) {
      return NextResponse.json({ success: false, message: 'Too many failed attempts for this code. Please request a new OTP.' }, { status: 400 });
    }

    // Validate OTP match
    if (otpRecord.otp !== hashOTP(otp)) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      const attemptsLeft = 3 - otpRecord.attempts;
      if (attemptsLeft <= 0) {
        return NextResponse.json({ success: false, message: 'Too many failed attempts for this code. Please request a new OTP.' }, { status: 400 });
      }
      
      return NextResponse.json({ success: false, message: `Invalid OTP. You have ${attemptsLeft} attempt(s) left.` }, { status: 400 });
    }

    // Find User
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update User
    user.passwordHash = passwordHash;
    await user.save();

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate JWT and set HttpOnly Cookie to auto-login
    const token = await signToken({ email: user.email, name: user.name });
    
    const response = NextResponse.json({ success: true, message: 'Password reset successfully! You are now logged in.' });
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Reset Password error:', error);
    return NextResponse.json({ success: false, message: 'Failed to reset password. Please try again.' }, { status: 500 });
  }
}
