import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, OTP } from '@/models';
import { sendOTP } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      // For security, you can choose to return success even if email doesn't exist to prevent email enumeration,
      // but in e-commerce, it's usually fine to tell the user they don't have an account.
      return NextResponse.json({ success: false, message: 'No account found with this email address.' }, { status: 404 });
    }

    // Check for Server-Side Rate Limiting (60 seconds cooldown)
    const existingOtp = await OTP.findOne({ email });
    if (existingOtp) {
      const now = new Date();
      const diffInSeconds = (now.getTime() - existingOtp.createdAt.getTime()) / 1000;
      if (diffInSeconds < 60) {
        return NextResponse.json({ 
          success: false, 
          message: `Please wait ${Math.ceil(60 - diffInSeconds)} seconds before requesting a new OTP.` 
        }, { status: 429 });
      }
    }

    // Generate a 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Save new OTP to database (TTL will auto-delete it after 5 mins)
    await OTP.create({
      email,
      otp,
    });

    // Send the OTP via Email
    await sendOTP(email, otp);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('Send Forgot Password OTP error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
  }
}
