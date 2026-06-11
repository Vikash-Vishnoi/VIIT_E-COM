import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User, OTP } from '@/models';
import { signToken } from '@/lib/jwt';
import { validatePassword, passwordErrorMsg } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    if (typeof email !== 'string' || typeof otp !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid payload format' }, { status: 400 });
    }

    if (!validatePassword(newPassword)) {
      return NextResponse.json({ success: false, message: passwordErrorMsg }, { status: 400 });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return NextResponse.json({ success: false, message: 'OTP has expired or was not sent. Please request a new one.' }, { status: 400 });
    }

    // Check for brute-force attempts
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ success: false, message: 'Too many failed attempts. For security, this OTP has been invalidated. Please request a new one.' }, { status: 400 });
    }

    // Validate OTP match
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      const attemptsLeft = 3 - otpRecord.attempts;
      if (attemptsLeft <= 0) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return NextResponse.json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' }, { status: 400 });
      }
      
      return NextResponse.json({ success: false, message: `Invalid OTP. You have ${attemptsLeft} attempt(s) left.` }, { status: 400 });
    }

    // Find User
    const user = await User.findOne({ email });
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
    const token = await signToken({ userId: user._id.toString(), email: user.email, role: user.role, name: user.name });
    
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
