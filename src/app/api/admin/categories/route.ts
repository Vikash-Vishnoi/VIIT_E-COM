import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { SubCategory, AdminAuditLog } from '@/models';

export const dynamic = 'force-dynamic';
import { getAdminUser } from '@/lib/auth';
import { validateObjectId } from '@/lib/productValidation';

export async function GET(request: NextRequest) {
  try {
    const adminId = await getAdminUser(request);
    if (!adminId) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();

    // Fetch categories sorted by level and sortOrder
    const categories = await SubCategory.find({})
      .select('label slug level parentId isActive sortOrder')
      .sort({ level: 1, sortOrder: 1 })
      .lean();

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('GET /api/admin/categories error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch categories' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminUser(request);
    if (!adminId) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    const body = await request.json();
    const { label, parentId, isActive, sortOrder } = body;

    if (typeof label !== 'string' || label.trim().length < 2 || label.trim().length > 50) {
      return NextResponse.json({ success: false, message: 'Label must be a string between 2 and 50 characters' }, { status: 400 });
    }
    const safeLabel = label.trim();

    if (parentId !== undefined && parentId !== null && parentId !== "") {
      const idValidation = validateObjectId(parentId, 'parent category');
      if (!idValidation.isValid) {
        return NextResponse.json({ success: false, message: idValidation.error }, { status: 400 });
      }
    }

    let safeIsActive = true;
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json({ success: false, message: 'isActive must be a boolean' }, { status: 400 });
      }
      safeIsActive = isActive;
    }

    let safeSortOrder = 0;
    if (sortOrder !== undefined) {
      if (typeof sortOrder !== 'number' || sortOrder < 0 || !Number.isInteger(sortOrder)) {
        return NextResponse.json({ success: false, message: 'sortOrder must be a positive integer' }, { status: 400 });
      }
      safeSortOrder = sortOrder;
    }

    // Auto-generate slug
    let slug = safeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Ensure slug is unique
    let existing = await SubCategory.exists({ slug });
    let counter = 1;
    while (existing) {
      slug = `${safeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${counter}`;
      existing = await SubCategory.exists({ slug });
      counter++;
    }

    // Calculate level
    let level: 0 | 1 | 2 = 0;
    if (parentId) {
      const parent = await SubCategory.findById(parentId).select('level').lean();
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
      label: safeLabel,
      parentId,
      level,
      isActive: safeIsActive,
      sortOrder: safeSortOrder,
    });

    await AdminAuditLog.create({
      adminId,
      action: 'CATEGORY_CREATED',
      resourceId: newCategory._id.toString(),
      resourceName: newCategory.label,
      metadata: {
        slug: newCategory.slug,
        level: newCategory.level,
        parentId: newCategory.parentId,
      },
    });

    return NextResponse.json({ success: true, data: newCategory });
  } catch (error: any) {
    console.error('POST /api/admin/categories error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create category' }, { status: 500 });
  }
}
