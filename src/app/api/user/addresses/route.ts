import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Address } from '@/models';
import { getAuthUser } from '@/lib/auth';

// GET: Fetch user's addresses
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const addresses = await Address.find({ user: userId }).lean();

    return NextResponse.json({ success: true, data: addresses || [] });
  } catch (error: any) {
    console.error('GET /api/user/addresses error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST: Add a new address
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Address details are required' }, { status: 400 });
    }


    // Required fields based on AddressSchema
    const { label, fullName, mobile, line1, line2, city, state, pincode, country, isDefault } = body;
    if (!fullName || !mobile || !line1 || !city || !state || !pincode) {
      return NextResponse.json({ success: false, message: 'Missing required address fields' }, { status: 400 });
    }

    const user = await User.findById(userId).select('_id');
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const newAddressData = {
      user: userId,
      label: label || 'Home',
      fullName,
      mobile,
      line1,
      line2,
      city,
      state,
      pincode,
      country: country || 'India',
      isDefault: Boolean(isDefault)
    };

    // Handle isDefault logic
    if (newAddressData.isDefault) {
      // Unset any existing default addresses for this user
      await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
    } else {
      // If this is their first address, force it to be default
      const existingCount = await Address.countDocuments({ user: userId });
      if (existingCount === 0) {
        newAddressData.isDefault = true;
      }
    }

    const createdAddress = await Address.create(newAddressData);

    return NextResponse.json({ success: true, message: 'Address added', data: createdAddress });
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
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Address details are required' }, { status: 400 });
    }

    const { addressId, label, fullName, mobile, line1, line2, city, state, pincode, country, isDefault } = body;
    if (!addressId) return NextResponse.json({ success: false, message: 'Address ID is required' }, { status: 400 });

    if (isDefault) {
      await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
    }

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, user: userId },
      { $set: { label, fullName, mobile, line1, line2, city, state, pincode, country, isDefault } },
      { new: true }
    );

    if (!updatedAddress) return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Address updated', data: updatedAddress });
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

    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get('id');
    if (!addressId) return NextResponse.json({ success: false, message: 'Address ID is required' }, { status: 400 });

    await connectDB();
    
    const deletedAddress = await Address.findOneAndDelete({ _id: addressId, user: userId });
    if (!deletedAddress) return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });

    // If the deleted address was the default, make another one default (if any exist)
    if (deletedAddress.isDefault) {
      const remainingAddress = await Address.findOne({ user: userId });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    return NextResponse.json({ success: true, message: 'Address removed' });
  } catch (error: any) {
    console.error('DELETE /api/user/addresses error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete address' }, { status: 500 });
  }
}
