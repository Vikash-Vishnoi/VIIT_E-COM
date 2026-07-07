import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { validateEmail, emailErrorMsg } from '@/lib/validation';
import { handleOTPGenerationAndSend } from '@/lib/auth';
import { logAuthEvent } from '@/lib/audit';

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
    const existingUser = await User.findOne({ email: normalizedEmail }).select('_id');
    if (!existingUser) {
      // If no user exists with the provided email, return a 404 response
      return NextResponse.json({ success: false, message: 'No account found with this email address.' }, { status: 404 });
    }

    const result = await handleOTPGenerationAndSend(normalizedEmail);

    if (result.success) {
      logAuthEvent(req, normalizedEmail, 'FORGOT_PASSWORD');
    }

    return NextResponse.json(
      { success: result.success, message: result.message },
      { status: result.status }
    );
  } catch (error: any) {
    console.error('Send Forgot Password OTP error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
  }
}
