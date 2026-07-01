import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { SubCategory, Product, AdminAuditLog } from '@/models';
import { getAdminUser } from '@/lib/auth';
import { validateObjectId } from '@/lib/productValidation';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const adminId = await getAdminUser(request);
    if (!adminId) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const idValidation = validateObjectId(id, 'category');
    if (!idValidation.isValid) {
      return NextResponse.json({ success: false, message: idValidation.error }, { status: 400 });
    }

    const body = await request.json();
    const { label, isActive, sortOrder } = body;

    // Validate label
    let safeLabel: string | undefined;
    if (label !== undefined) {
      if (typeof label !== 'string' || label.trim().length < 2 || label.trim().length > 50) {
        return NextResponse.json({ success: false, message: 'Label must be a string between 2 and 50 characters' }, { status: 400 });
      }
      safeLabel = label.trim();
    }

    // Validate isActive
    let safeIsActive: boolean | undefined;
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json({ success: false, message: 'isActive must be a boolean' }, { status: 400 });
      }
      safeIsActive = isActive;
    }

    // Validate sortOrder
    let safeSortOrder: number | undefined;
    if (sortOrder !== undefined) {
      if (typeof sortOrder !== 'number' || sortOrder < 0 || !Number.isInteger(sortOrder)) {
        return NextResponse.json({ success: false, message: 'sortOrder must be a positive integer' }, { status: 400 });
      }
      safeSortOrder = sortOrder;
    }

    const category = await SubCategory.findById(id).select('label isActive sortOrder');
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    // We do NOT update the slug here to prevent breaking product references.
    if (safeLabel !== undefined) category.label = safeLabel;
    if (safeIsActive !== undefined) category.isActive = safeIsActive;
    if (safeSortOrder !== undefined) category.sortOrder = safeSortOrder;

    await category.save();

    await AdminAuditLog.create({
      adminId,
      action: 'CATEGORY_UPDATED',
      resourceId: category._id.toString(),
      resourceName: category.label,
      metadata: {
        isActive: category.isActive,
        sortOrder: category.sortOrder,
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error('PUT /api/admin/categories/[id] error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const adminId = await getAdminUser(request);
    if (!adminId) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const idValidation = validateObjectId(id, 'category');
    if (!idValidation.isValid) {
      return NextResponse.json({ success: false, message: idValidation.error }, { status: 400 });
    }

    const category = await SubCategory.findById(id).select('slug label').lean();
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    // 1. Option A Safety: Check if it has child categories
    const childrenCount = await SubCategory.countDocuments({ parentId: id });
    if (childrenCount > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot delete: This category has child sub-categories. Please delete them first.' 
      }, { status: 400 });
    }

    // 2. Option A Safety: Check if products are attached to this category slug
    const productCount = await Product.countDocuments({
      $or: [
        { category: category.slug },
        { subCategory: category.slug },
        { subSubCategory: category.slug }
      ]
    });

    if (productCount > 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Cannot delete: There are ${productCount} products attached to this category.` 
      }, { status: 400 });
    }

    // Safe to delete
    await SubCategory.deleteOne({ _id: id });

    await AdminAuditLog.create({
      adminId,
      action: 'CATEGORY_DELETED',
      resourceId: id,
      resourceName: category.label,
      metadata: {
        slug: category.slug,
      },
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/admin/categories/[id] error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete category' }, { status: 500 });
  }
}
