import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { getAuthUser } from '@/lib/auth';
import { validatePassword, passwordErrorMsg } from '@/lib/validation';
import { logAuthEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    let currentPassword: any, newPassword: any;
    try {
      const body = await req.json();
      ({ currentPassword, newPassword } = body);
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid payload format' }, { status: 400 });
    }
    
    if (!validatePassword(currentPassword)) {
      return NextResponse.json({ success: false, message: passwordErrorMsg }, { status: 400 });
    }

    if (!validatePassword(newPassword)) {
      return NextResponse.json({ success: false, message: passwordErrorMsg }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ success: false, message: 'New password cannot be the same as your current password' }, { status: 400 });
    }

    const user = await User.findById(userId).select('passwordHash');
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Incorrect current password' }, { status: 401 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    await user.save();

    logAuthEvent(req, user.email, 'PASSWORD_CHANGED');

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change Password error:', error);
    return NextResponse.json({ success: false, message: 'Failed to change password' }, { status: 500 });
  }
}
