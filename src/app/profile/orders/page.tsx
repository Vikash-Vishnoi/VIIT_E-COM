"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";

type OrderItem = {
  productId: string;
  title: string;
  colorName: string;
  size: string;
  quantity: number;
  priceAtOrder: number;
};

type Order = {
  _id: string;
  orderId: string;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    mobile: string;
  };
  pricing: {
    subtotal: number;
    tax: number;
    shippingFee: number;
    total: number;
  };
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  timeline: { status: string; message: string; timestamp: string }[];
  createdAt: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/user/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      } else {
        if (res.status === 401) {
          router.push("/login?returnTo=/profile/orders");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-lg font-black uppercase tracking-widest text-black mb-8 border-b border-gray-100 pb-4">My Orders</h2>

      {ordersLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Loading Orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Package size={32} className="text-gray-300" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-black mb-2">No Orders Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm leading-relaxed mb-8">
            When you place an order, it will appear here.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full md:w-auto px-8 py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const isExpanded = expandedOrder === order._id;
            const statusColor: Record<string, string> = {
              Placed:    'bg-blue-50 text-blue-600 border-blue-100',
              Confirmed: 'bg-indigo-50 text-indigo-600 border-indigo-100',
              Shipped:   'bg-yellow-50 text-yellow-600 border-yellow-100',
              Delivered: 'bg-green-50 text-green-600 border-green-100',
              Cancelled: 'bg-red-50 text-red-500 border-red-100',
              Returned:  'bg-gray-50 text-gray-500 border-gray-200',
            };
            const paymentColor: Record<string, string> = {
              Paid:    'text-green-600',
              Pending: 'text-yellow-600',
              Failed:  'text-red-500',
              Refunded:'text-gray-500',
            };

            return (
              <div key={order._id} className="border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                  className="w-full grid grid-cols-2 md:flex md:flex-wrap items-center justify-between gap-4 px-4 md:px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Order ID</span>
                    <span className="text-sm font-black text-black">{order.orderId}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Date</span>
                    <span className="text-sm font-semibold text-black">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Total</span>
                    <span className="text-sm font-black text-black">₹{order.pricing.total.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Payment</span>
                    <span className={`text-xs font-black uppercase ${paymentColor[order.paymentStatus] || 'text-gray-500'}`}>
                      {order.paymentStatus}
                    </span>
                  </div>

                  <div className="col-span-2 md:col-span-1 flex items-center justify-between md:justify-start gap-3 mt-2 md:mt-0">
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider px-3 py-1 border rounded-full ${statusColor[order.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {order.status}
                    </span>
                    <svg
                      className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 py-6 bg-gray-50 flex flex-col gap-8">
                    <div>
                      <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Items Ordered</h4>
                      <div className="flex flex-col gap-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-start bg-white border border-gray-100 p-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-black">{item.title}</span>
                              <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                {item.colorName !== 'Default' && <span>Color: {item.colorName}</span>}
                                {item.size !== 'Default' && <span>Size: {item.size}</span>}
                                <span>Qty: {item.quantity}</span>
                              </div>
                            </div>
                            <span className="text-sm font-black text-black whitespace-nowrap">
                              ₹{(item.priceAtOrder * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Pricing</h4>
                        <div className="flex flex-col gap-2 text-xs md:text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-semibold">Subtotal</span>
                            <span className="font-bold">₹{(order.pricing.total - order.pricing.tax).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-semibold">GST (18%)</span>
                            <span className="font-bold">₹{order.pricing.tax.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-semibold">Shipping</span>
                            <span className="text-green-600 font-black text-[10px] md:text-xs uppercase">Free</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                            <span className="font-black uppercase tracking-wider text-black">Total</span>
                            <span className="font-black text-black">₹{order.pricing.total.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-[10px] md:text-xs mt-1">
                            <span className="text-gray-400 font-semibold">Payment Method</span>
                            <span className="font-bold uppercase">{order.paymentMethod}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Delivery Address</h4>
                        <div className="text-xs md:text-sm text-gray-600 leading-relaxed">
                          <p className="font-bold text-black">{order.shippingAddress.fullName}</p>
                          <p>{order.shippingAddress.line1}</p>
                          <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                          <p className="text-gray-400 text-[10px] md:text-xs mt-1">Ph: {order.shippingAddress.mobile}</p>
                        </div>
                      </div>
                    </div>

                    {order.timeline && order.timeline.length > 0 && (
                      <div>
                        <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Order Timeline</h4>
                        <div className="flex flex-col gap-3">
                          {[...order.timeline].reverse().map((event, i) => (
                            <div key={i} className="flex items-start gap-4">
                              <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-black' : 'bg-gray-300'}`} />
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-black">{event.status}</span>
                                <span className="text-[10px] md:text-xs text-gray-500">{event.message}</span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(event.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
