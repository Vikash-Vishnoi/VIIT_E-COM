import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, OTP } from '@/models';
import { sendOTP } from '@/lib/mail';
import { validateEmail, emailErrorMsg, hashOTP } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    let email: any;
    try {
      const body = await req.json();
      email = body.email;
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid payload format' }, { status: 400 });
    }


    if (!validateEmail(email)) {
      return NextResponse.json({ success: false, message: emailErrorMsg }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (!existingUser) {
      // If no user exists with the provided email, return a 404 response
      return NextResponse.json({ success: false, message: 'No account found with this email address.' }, { status: 404 });
    }

    // Check for Server-Side Rate Limiting & Lockout
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
        return NextResponse.json({ 
          success: false, 
          message: `Please wait ${Math.ceil(60 - diffInSeconds)} seconds before requesting a new OTP.` 
        }, { status: 429 });
      }

      // 3. Check if max sends reached (3 total sends)
      if (existingOtp.sendCount >= 3) {
        existingOtp.isLocked = true;
        existingOtp.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 mins
        existingOtp.createdAt = new Date(); // Reset TTL timer
        await existingOtp.save();
        return NextResponse.json(
          { success: false, message: 'Maximum attempts reached. Please try again after 30 minutes.' },
          { status: 429 },
        );
      }
    }

    // Generate a 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    const hashedOtp = hashOTP(otp);

    // Save or update OTP in database
    if (existingOtp) {
      existingOtp.otp = hashedOtp;
      existingOtp.sendCount += 1;
      existingOtp.createdAt = new Date();
      await existingOtp.save();
    } else {
      await OTP.create({
        email: normalizedEmail,
        otp: hashedOtp,
      });
    }

    // Send the OTP via Email
    await sendOTP(normalizedEmail, otp);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('Send Forgot Password OTP error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
  }
}
