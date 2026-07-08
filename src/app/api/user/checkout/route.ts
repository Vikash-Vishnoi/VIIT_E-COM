import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Cart, Order, Product, Address } from '@/models';
import { getAuthUser } from '@/lib/auth';

// Generate a random, clean order ID
const generateOrderId = () => {
  const year = new Date().getFullYear();
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VIIT-${year}-${randomStr}`;
};

// POST: Place an Order
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUser(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Shipping address and payment method are required to place an order' }, { status: 400 });
    }

    const { addressId, paymentMethod } = body;
    
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return NextResponse.json({ success: false, message: 'Invalid Address ID format' }, { status: 400 });
    }

    const VALID_PAYMENT_METHODS = ['UPI', 'Card', 'COD'];
    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ success: false, message: `Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}` }, { status: 400 });
    }

    // 1. Validate Address and User Ownership

    const selectedAddress = await Address.findOne({ _id: addressId, user: userId })
      .select('-user -createdAt -updatedAt -__v')
      .lean();
    if (!selectedAddress) {
      return NextResponse.json({ success: false, message: 'Invalid shipping address' }, { status: 400 });
    }

    // 2. Fetch Cart Items and populate Product details securely (including colors for inventory check)
    const cartItems = await Cart.find({ userId })
      .select('productId quantity colorName size')
      .populate({ path: 'productId', select: 'title sellingPrice colors' })
      .lean();

    if (cartItems.length === 0) {
      return NextResponse.json({ success: false, message: 'Your cart is empty' }, { status: 400 });
    }

    // 3. Validate Stock, Build Order Items, and Prepare Bulk Operations
    let subtotal = 0;
    const orderItems = [];
    const bulkOperations: any[] = [];

    for (const item of cartItems) {
      const product = item.productId as any;
      
      // Find the specific variant to check stock
      let variantStock = 0;
      for (const color of product.colors) {
        if (color.colorName === item.colorName) {
          for (const size of color.sizes) {
            if (size.size === item.size) {
              variantStock = size.quantity;
              break;
            }
          }
        }
      }

      if (item.quantity > variantStock) {
        return NextResponse.json({ 
          success: false, 
          message: `Insufficient stock for ${product.title} (${item.colorName}, Size ${item.size}). Only ${variantStock} left.` 
        }, { status: 400 });
      }

      // Add to bulk operations to decrement inventory WITH concurrency safety
      bulkOperations.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { 'colors.$[c].sizes.$[s].quantity': -item.quantity } },
          arrayFilters: [
            { 'c.colorName': item.colorName }, 
            { 's.size': item.size, 's.quantity': { $gte: item.quantity } } // Strict constraint: prevents going below 0
          ]
        }
      });
      
      // Price at order is locked in
      const priceAtOrder = product.sellingPrice;
      const quantity = item.quantity;
      
      subtotal += (priceAtOrder * quantity);

      orderItems.push({
        productId: product._id,
        title: product.title,
        colorName: item.colorName,
        size: item.size,
        quantity: quantity,
        priceAtOrder: priceAtOrder,
      });
    }

    // Pricing calculation
    const tax = Math.round(subtotal - (subtotal / 1.18)); // Included 18% GST calculation
    const total = subtotal; // Assuming Free Shipping for now

    // 4. Deduct Inventory FIRST (Detect Race Conditions)
    if (bulkOperations.length > 0) {
      const bulkResult = await Product.bulkWrite(bulkOperations);
      // If the modified count doesn't match the operations, someone bought the last item between our read and write!
      if (bulkResult.modifiedCount !== bulkOperations.length) {
        return NextResponse.json({ 
          success: false, 
          message: 'An item in your cart just went out of stock! Please refresh your cart.' 
        }, { status: 409 });
      }
    }

    // 5. Create Order
    const newOrder = await Order.create({
      orderId: generateOrderId(),
      userId,
      items: orderItems,
      shippingAddress: selectedAddress as any,
      pricing: {
        subtotal,
        discount: 0,
        couponDiscount: 0,
        shippingFee: 0,
        tax,
        total,
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid', // Assuming mock gateway pays instantly
      status: 'Placed',
      timeline: [{ status: 'Placed', message: 'Order placed successfully' }],
    });

    // 6. Clear the User's Cart
    await Cart.deleteMany({ userId });

    return NextResponse.json({ success: true, message: 'Order placed successfully' });

  } catch (error: any) {
    console.error('POST /api/user/checkout error:', error);
    return NextResponse.json({ success: false, message: 'Failed to place order' }, { status: 500 });
  }
}
