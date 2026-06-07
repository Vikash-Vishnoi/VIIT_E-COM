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
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Email is already registered. Please login.' }, { status: 400 });
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

    // Save new OTP
    await OTP.create({ email, otp });

    // Send email
    await sendOTP(email, otp);

    return Response.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return Response.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
  }
}
