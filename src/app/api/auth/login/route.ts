import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { signToken, signAdminToken } from '@/lib/jwt';
import { validateEmail, validatePassword } from '@/lib/validation';
import { logAuthEvent } from '@/lib/audit';

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
    const user = await User.findOne({ email: normalizedEmail }).select('passwordHash isActive failedLoginAttempts lockUntil name role');
    if (!user) {
      logAuthEvent(req, normalizedEmail, 'LOGIN_FAILED');
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      logAuthEvent(req, normalizedEmail, 'ACCOUNT_LOCKED');
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
        logAuthEvent(req, normalizedEmail, 'ACCOUNT_LOCKED');
      } else {
        logAuthEvent(req, normalizedEmail, 'LOGIN_FAILED');
      }
      await user.save();
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // Check if account is active
    if (!user.isActive) {
      logAuthEvent(req, normalizedEmail, 'LOGIN_FAILED');
      return NextResponse.json({ success: false, message: 'Your account has been deactivated. Please contact support at ' + process.env.SUPPORT_EMAIL }, { status: 403 });
    }

    // Reset failed attempts and update last login
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT — admins get a short-lived 8h token, customers get 30d for good UX
    // userId and role are included so getAuthUser/getAdminUser can authenticate
    // from the cryptographically-verified payload alone — no DB lookup needed.
    // role is only embedded in admin tokens; customer tokens don't need it.
    const isAdmin = user.role === 'admin';
    const token = isAdmin
      ? await signAdminToken({ userId: user._id.toString(), email: normalizedEmail, name: user.name, role: user.role })
      : await signToken({ userId: user._id.toString(), email: normalizedEmail, name: user.name });

    logAuthEvent(req, normalizedEmail, 'LOGIN_SUCCESS');

    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged in successfully', 
    });
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: isAdmin
        ? 8 * 60 * 60          // 8 hours for admins
        : 30 * 24 * 60 * 60,  // 30 days for customers
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Login failed. Please try again later.' }, { status: 500 });
  }
}
