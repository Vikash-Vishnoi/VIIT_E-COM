import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SubCategory } from '@/models';

export const revalidate = 86400; // Cache for 24 hours

/**
 * GET /api/categories/nav
 *
 * Returns the full 3-level nav tree for all active categories:
 * [
 *   {
 *     _id, slug, label, level: 0,
 *     children: [
 *       { _id, slug, label, level: 1, parentId,
 *         children: [
 *           { _id, slug, label, level: 2, parentId }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 *
 * Level-0 slugs map to the top-level nav labels (man, woman, kids, accessories…)
 */
export async function GET() {
  try {
    await connectDB();

    // Fetch all active categories in one query, sorted by level + sortOrder
    const all = await SubCategory.find({ isActive: true })
      .sort({ level: 1, sortOrder: 1 })
      .select('_id slug label parentId level sortOrder')
      .lean();

    // Build lookup maps
    const byId = new Map(all.map(c => [String(c._id), { ...c, children: [] as any[] }]));

    // Wire children to parents
    for (const cat of byId.values()) {
      if (cat.parentId) {
        const parent = byId.get(String(cat.parentId));
        if (parent) parent.children.push(cat);
      }
    }

    // Return only level-0 roots (they already carry their nested children)
    const roots = [...byId.values()].filter(c => c.level === 0);

    return NextResponse.json({ success: true, data: roots });
  } catch (error) {
    console.error('GET /api/categories/nav error:', error);
    return NextResponse.json({ success: false, message: 'Failed to load navigation' }, { status: 500 });
  }
}
