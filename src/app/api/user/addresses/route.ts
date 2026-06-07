import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

// Helper to authenticate request
async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;
  if (typeof payload.userId !== 'string') return null;
  return payload.userId;
}

// POST: Add a new address
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const { label, fullName, mobile, line1, line2, city, state, pincode, country, isDefault } = body;

    if (!line1 || !city || !state || !pincode || !country || !fullName || !mobile) {
      return NextResponse.json({ success: false, message: 'All address fields are required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    // If new address is default, unset others
    if (isDefault) {
      user.address.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    // If it's the first address, make it default automatically
    const finalIsDefault = user.address.length === 0 ? true : isDefault || false;

    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      label: label || 'Home',
      fullName,
      mobile,
      line1,
      line2,
      city,
      state,
      pincode,
      country,
      isDefault: finalIsDefault
    };

    user.address.push(newAddress);
    await user.save();

    return NextResponse.json({ success: true, message: 'Address added successfully', data: newAddress });
  } catch (error: any) {
    console.error('POST /api/user/addresses error:', error);
    return NextResponse.json({ success: false, message: 'Failed to add address' }, { status: 500 });
  }
}

// PUT: Update an existing address
export async function PUT(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const { addressId, label, fullName, mobile, line1, line2, city, state, pincode, country, isDefault } = body;

    if (!addressId) return NextResponse.json({ success: false, message: 'Address ID is required' }, { status: 400 });

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const addressIndex = user.address.findIndex((addr: any) => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
    }

    // If this address is becoming default, unset others
    if (isDefault) {
      user.address.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    // Update fields
    user.address[addressIndex] = {
      ...user.address[addressIndex],
      label: label || user.address[addressIndex].label,
      fullName: fullName || user.address[addressIndex].fullName,
      mobile: mobile || user.address[addressIndex].mobile,
      line1: line1 || user.address[addressIndex].line1,
      line2: line2 !== undefined ? line2 : user.address[addressIndex].line2,
      city: city || user.address[addressIndex].city,
      state: state || user.address[addressIndex].state,
      pincode: pincode || user.address[addressIndex].pincode,
      country: country || user.address[addressIndex].country,
      isDefault: isDefault !== undefined ? isDefault : user.address[addressIndex].isDefault
    };

    await user.save();

    return NextResponse.json({ success: true, message: 'Address updated successfully', data: user.address[addressIndex] });
  } catch (error: any) {
    console.error('PUT /api/user/addresses error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update address' }, { status: 500 });
  }
}

// DELETE: Remove an address
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get('id');

    if (!addressId) return NextResponse.json({ success: false, message: 'Address ID is required' }, { status: 400 });

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const initialLength = user.address.length;
    user.address = user.address.filter((addr: any) => addr._id.toString() !== addressId);

    if (user.address.length === initialLength) {
      return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
    }

    // If we deleted the default address and there are others left, make the first one default
    if (user.address.length > 0 && !user.address.some((addr: any) => addr.isDefault)) {
      user.address[0].isDefault = true;
    }

    await user.save();

    return NextResponse.json({ success: true, message: 'Address removed successfully' });
  } catch (error: any) {
    console.error('DELETE /api/user/addresses error:', error);
    return NextResponse.json({ success: false, message: 'Failed to remove address' }, { status: 500 });
  }
}
