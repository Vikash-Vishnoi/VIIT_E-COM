import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { User, OTP } from '@/models';
import { connectDB } from '@/lib/db';
import { hashOTP } from '@/lib/validation';
import { sendOTP } from '@/lib/mail';

/**
 * Extracts and verifies the JWT from the request cookies.
 * Looks up the user by email (since userId is no longer in the payload for security reasons),
 * and returns the user's ObjectId as a string if valid and active.
 */
export async function getAuthUser(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || typeof payload.email !== 'string') return null;

  await connectDB();
  const user = await User.findOne({ email: payload.email }).select('_id isActive');
  
  if (!user || !user.isActive) return null;

  return user._id.toString();
}

/**
 * Handles the rate limiting, lockout, generation, saving, and emailing of an OTP.
 * Returns an object with { success, message, status } which can be passed directly to NextResponse.json.
 */
export async function handleOTPGenerationAndSend(normalizedEmail: string) {
  let existingOtp = await OTP.findOne({ email: normalizedEmail });
  
  if (existingOtp) {
    // 1. Check if completely locked out
    if (existingOtp.isLocked && existingOtp.lockedUntil && existingOtp.lockedUntil > new Date()) {
      const remainingMins = Math.ceil((existingOtp.lockedUntil.getTime() - Date.now()) / 60000);
      return { success: false, message: `Maximum attempts reached. Please try again after ${remainingMins} minutes.`, status: 429 };
    }

    // 2. Check 60-second cooldown
    const diffInSeconds = (Date.now() - existingOtp.createdAt.getTime()) / 1000;
    if (diffInSeconds < 60) {
      return { success: false, message: `Please wait ${Math.ceil(60 - diffInSeconds)} seconds before requesting a new OTP.`, status: 429 };
    }

    // 3. Check if max sends reached (3 total sends)
    if (existingOtp.sendCount >= 3) {
      existingOtp.isLocked = true;
      existingOtp.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 mins
      existingOtp.createdAt = new Date(); // Reset TTL timer
      await existingOtp.save();
      return { success: false, message: 'Maximum attempts reached. Please try again after 30 minutes.', status: 429 };
    }
  }

  // Generate 5-digit OTP
  const plainOtp = Math.floor(10000 + Math.random() * 90000).toString();
  const hashedOtp = hashOTP(plainOtp);

  // Save or update OTP in database
  if (existingOtp) {
    existingOtp.otp = hashedOtp;
    existingOtp.attempts = 0; // Reset validation attempts for the new code
    existingOtp.sendCount += 1;
    existingOtp.createdAt = new Date(); // Update time
    await existingOtp.save();
  } else {
    await OTP.create({ email: normalizedEmail, otp: hashedOtp, sendCount: 1 });
  }

  // Send plaintext OTP via email
  await sendOTP(normalizedEmail, plainOtp);
  
  return { success: true, message: 'OTP sent successfully', status: 200 };
}
