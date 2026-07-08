import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Address } from '@/models';
import { getAuthUser } from '@/lib/auth';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

function validateAddressData(data: any, isUpdate = false) {
  const { addressId, label, fullName, mobile, line1, line2, city, state, pincode, country, isDefault } = data;

  if (isUpdate) {
    if (!addressId) return 'Address ID is required';
    if (!mongoose.Types.ObjectId.isValid(addressId)) return 'Invalid Address ID format';
  }

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length > 50) return 'Invalid Full Name (max 50 chars)';
  if (!mobile || !/^\d{10}$/.test(mobile)) return 'Mobile must be a 10-digit number';
  if (!line1 || typeof line1 !== 'string' || line1.trim().length > 100) return 'Invalid Street Address (max 100 chars)';
  if (line2 && (typeof line2 !== 'string' || line2.trim().length > 100)) return 'Invalid Line 2 (max 100 chars)';
  if (!city || typeof city !== 'string' || city.trim().length > 50) return 'Invalid City (max 50 chars)';
  if (!state || !INDIAN_STATES.includes(state)) return 'Invalid State selected';
  if (!pincode || !/^\d{5,6}$/.test(pincode)) return 'Pincode must be 5 or 6 digits';
  if (country && (typeof country !== 'string' || country.trim().length > 50)) return 'Invalid Country (max 50 chars)';
  if (label && !['Home', 'Work', 'Other'].includes(label)) return 'Label must be Home, Work, or Other';
  if (isDefault !== undefined && typeof isDefault !== 'boolean') return 'isDefault must be a boolean';

  return null;
}

// GET: Fetch user's addresses
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const addresses = await Address.find({ user: userId }).select('-__v -user -createdAt -updatedAt').lean();

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


    const errorMsg = validateAddressData(body, false);
    if (errorMsg) {
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const { label, fullName, mobile, line1, line2, city, state, pincode, country, isDefault } = body;

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

    // Get existing address count
    const existingCount = await Address.countDocuments({ user: userId });

    if (existingCount >= 5) {
      return NextResponse.json({ success: false, message: 'Maximum of 5 addresses allowed' }, { status: 400 });
    }

    // Handle isDefault logic
    if (newAddressData.isDefault) {
      // Unset any existing default addresses for this user
      await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
    } else {
      // If this is their first address, force it to be default
      if (existingCount === 0) {
        newAddressData.isDefault = true;
      }
    }

    const { _id } = await Address.create(newAddressData);

    return NextResponse.json({ success: true, id: _id });
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

    const errorMsg = validateAddressData(body, true);
    if (errorMsg) {
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const { addressId, label, fullName, mobile, line1, line2, city, state, pincode, country, isDefault } = body;

    if (isDefault) {
      await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
    } else {
      // Edge Case: If they are setting isDefault to false, but it's their ONLY address, force it true
      const existingCount = await Address.countDocuments({ user: userId });
      if (existingCount <= 1) {
        body.isDefault = true;
      }
    }

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, user: userId },
      { $set: { label, fullName, mobile, line1, line2, city, state, pincode, country, isDefault: body.isDefault ?? isDefault } },
      { new: true }
    ).select('_id').lean();

    if (!updatedAddress) return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Address updated' });
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

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return NextResponse.json({ success: false, message: 'Invalid address ID format' }, { status: 400 });
    }

    await connectDB();

    const deletedAddress = await Address.findOneAndDelete({ _id: addressId, user: userId }).select('isDefault').lean();
    if (!deletedAddress) return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });

    // If the deleted address was the default, make another one default (if any exist)
    if (deletedAddress.isDefault) {
      await Address.findOneAndUpdate(
        { user: userId },
        { $set: { isDefault: true } }
      ).select('_id').lean();
    }

    return NextResponse.json({ success: true, message: 'Address removed' });
  } catch (error: any) {
    console.error('DELETE /api/user/addresses error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete address' }, { status: 500 });
  }
}
