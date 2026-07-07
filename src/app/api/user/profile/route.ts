import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { getAuthUser } from '@/lib/auth';

// GET: Fetch full user profile
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(userId).select('name email mobile').lean();

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error('GET /api/user/profile error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update basic details (name, mobile)
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    let name: string | undefined, mobile: string | undefined;
    try {
      const body = await req.json();
      ({ name, mobile } = body);
    } catch {
      return NextResponse.json({ success: false, message: 'Name and mobile number are required to update your profile' }, { status: 400 });
    }


    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 50) {
      return NextResponse.json({ success: false, message: 'Invalid Name (max 50 chars)' }, { status: 400 });
    }
    
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ success: false, message: 'Mobile must be a 10-digit number' }, { status: 400 });
    }

    // Check if mobile is being used by another account (excluding current user)
    const existingMobileUser = await User.exists({ mobile, _id: { $ne: userId } });
    if (existingMobileUser) {
      return NextResponse.json({ success: false, message: 'This mobile number is already in use by another account.' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { name, mobile } },
      { new: true, runValidators: true }
    ).select('_id').lean();

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('PATCH /api/user/profile error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update profile' }, { status: 500 });
  }
}
