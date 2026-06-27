import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { signToken } from '@/lib/jwt';
import { validateEmail, validatePassword } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    let email: any;
    let password: any;
    try {
      const body = await req.json();
      email = body.email;
      password = body.password;
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid payload format' }, { status: 400 });
    }

    if (!validateEmail(email) || !validatePassword(password)) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Find the user with minimized data selection
    const user = await User.findOne({ email: normalizedEmail }).select('passwordHash isActive failedLoginAttempts lockUntil name');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json({ 
        success: false, 
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${waitMinutes} minutes.` 
      }, { status: 429 });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 3) {
        // Lock account for 30 minutes
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await user.save();
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json({ success: false, message: 'Your account has been deactivated. Please contact support at ' + process.env.SUPPORT_EMAIL }, { status: 403 });
    }

    // Reset failed attempts and update last login
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT and set HttpOnly Cookie using normalized email
    const token = await signToken({ email: normalizedEmail, name: user.name });
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged in successfully', 
    });
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Login failed. Please try again later.' }, { status: 500 });
  }
}
