import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { verifyToken } from '@/lib/jwt';

// Helper to authenticate request
async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;
  if (typeof payload.userId !== 'string') return null;
  return payload.userId;
}

// GET: Fetch user's addresses
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findById(userId).select('address').lean();
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: user.address || [] });
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
    const body = await req.json();

    // Required fields based on AddressSchema
    const { label, fullName, mobile, line1, line2, city, state, pincode, country, isDefault } = body;
    if (!fullName || !mobile || !line1 || !city || !state || !pincode) {
      return NextResponse.json({ success: false, message: 'Missing required address fields' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const newAddress = {
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

    // If this is the first address, or it's explicitly set as default, we might want to unset other defaults
    // but the schema doesn't strictly enforce unique defaults. We'll manually handle it for better UX.
    if (newAddress.isDefault && user.address && user.address.length > 0) {
      user.address.forEach(a => { a.isDefault = false; });
    } else if (!user.address || user.address.length === 0) {
      newAddress.isDefault = true; // First address is always default
    }

    user.address.push(newAddress as any);
    await user.save();

    return NextResponse.json({ success: true, message: 'Address added', data: user.address });
  } catch (error: any) {
    console.error('POST /api/user/addresses error:', error);
    return NextResponse.json({ success: false, message: 'Failed to add address' }, { status: 500 });
  }
}
