import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Cart, Wishlist } from "@/models";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/session
 *
 * Bootstrap endpoint called once on every page load.
 * Consolidates what were previously 3 separate requests:
 *   - GET /api/auth/me           (is the user logged in?)
 *   - GET /api/user/cart/count   (cart badge number)
 *   - GET /api/user/wishlist/ids (pre-fill wishlist heart icons)
 *
 * Auth is validated from the JWT payload alone (no DB hit � Fix 1.1).
 * Cart and wishlist queries run in parallel after a single JWT verify.
 *
 * Authenticated:   { authenticated: true, cartCount: number, wishlistIds: string[] }
 * Unauthenticated: { authenticated: false }
 */
export async function GET(req: NextRequest) {
  try {
    // Step 1: Authenticate from JWT — zero DB hit (Fix 1.1)
    const userId = await getAuthUser(req);
    if (!userId) {
      return NextResponse.json({ authenticated: false });
    }

    // Step 2: Fire cart + wishlist queries in parallel (single connectDB call)
    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(userId);


    const [cartResult, wishlistDocs] = await Promise.all([
      // DB-level aggregation — returns 1 document regardless of cart size
      Cart.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      // Wishlist IDs only — minimal payload
      Wishlist.find({ userId }).select("productId -_id").lean(),
    ]);

    const cartCount   = cartResult[0]?.total ?? 0;
    const wishlistIds = (wishlistDocs as any[]).map((w) => w.productId.toString());

    return NextResponse.json({ authenticated: true, cartCount, wishlistIds });
  } catch (error: any) {
    console.error("GET /api/user/session error:", error);
    return NextResponse.json({ authenticated: false });
  }
}
