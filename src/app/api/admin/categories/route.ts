import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SubCategory } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get('all') === 'true';

    const filter = fetchAll ? {} : { isActive: true };

    // Fetch categories sorted by level and sortOrder
    const categories = await SubCategory.find(filter)
      .sort({ level: 1, sortOrder: 1 })
      .lean();

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('GET /api/admin/categories error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { label, parentId, image, isActive } = body;

    if (!label) {
      return NextResponse.json({ success: false, message: 'Label is required' }, { status: 400 });
    }

    // Auto-generate slug
    let slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Ensure slug is unique
    let existing = await SubCategory.findOne({ slug });
    let counter = 1;
    while (existing) {
      slug = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${counter}`;
      existing = await SubCategory.findOne({ slug });
      counter++;
    }

    // Calculate level
    let level: 0 | 1 | 2 = 0;
    if (parentId) {
      const parent = await SubCategory.findById(parentId);
      if (!parent) {
        return NextResponse.json({ success: false, message: 'Parent category not found' }, { status: 400 });
      }
      const newLevel = parent.level + 1;
      if (newLevel > 2) {
        return NextResponse.json({ success: false, message: 'Cannot create beyond sub-sub-category (level 2 max)' }, { status: 400 });
      }
      level = newLevel as 0 | 1 | 2;
    } else {
      // Restriction: Main Categories (Level 0) cannot be created via the UI
      return NextResponse.json({ success: false, message: 'Creating new Main Categories is restricted. Please select a Parent Category.' }, { status: 400 });
    }

    const newCategory = await SubCategory.create({
      slug,
      label,
      parentId,
      level,
      image: image || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ success: true, data: newCategory });
  } catch (error: any) {
    console.error('POST /api/admin/categories error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create category' }, { status: 500 });
  }
}
