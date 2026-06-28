import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const VALID_STATUSES = ['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
const VALID_PAYMENT  = ['Pending', 'Paid', 'Refunded', 'Failed'];

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { orderId: id };

    const order = await Order.findOne(query).lean();
    if (!order) return Response.json({ success: false, message: 'Order not found' }, { status: 404 });

    return Response.json({ success: true, data: order });
  } catch (error) {
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;
    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ success: false, message: 'Order update data is required (status, paymentStatus, or tracking info)' }, { status: 400 });
    }


    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { orderId: id };

    const allowed: Record<string, any> = {};
    if (body.status && VALID_STATUSES.includes(body.status)) {
      allowed.status = body.status;
      // Auto-push a timeline event
      const update = {
        ...allowed,
        $push: {
          timeline: {
            status: body.status,
            message: body.message || `Status updated to ${body.status}`,
            timestamp: new Date(),
          }
        }
      };
      const order = await Order.findOneAndUpdate(query, update, { new: true }).lean();
      if (!order) return Response.json({ success: false, message: 'Order not found' }, { status: 404 });
      return Response.json({ success: true, data: order });
    }

    if (body.paymentStatus && VALID_PAYMENT.includes(body.paymentStatus)) {
      allowed.paymentStatus = body.paymentStatus;
    }
    if (body.trackingNumber) allowed.trackingNumber = body.trackingNumber;
    if (body.deliveryPartner) allowed.deliveryPartner = body.deliveryPartner;

    if (Object.keys(allowed).length === 0) {
      return Response.json({ success: false, message: 'No valid fields to update' }, { status: 400 });
    }

    const order = await Order.findOneAndUpdate(query, allowed, { new: true }).lean();
    if (!order) return Response.json({ success: false, message: 'Order not found' }, { status: 404 });

    return Response.json({ success: true, data: order });
  } catch (error: any) {
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
