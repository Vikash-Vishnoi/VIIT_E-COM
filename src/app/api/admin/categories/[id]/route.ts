import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { SubCategory, Product } from '@/models';
import { getAdminUser } from '@/lib/auth';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const adminId = await getAdminUser(request);
    if (!adminId) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    await connectDB();
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { label, image, isActive, sortOrder } = body;

    const category = await SubCategory.findById(id);
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    // We do NOT update the slug here to prevent breaking product references.
    if (label) category.label = label;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;

    await category.save();

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

    const category = await SubCategory.findById(id);
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
    await SubCategory.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/admin/categories/[id] error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete category' }, { status: 500 });
  }
}
