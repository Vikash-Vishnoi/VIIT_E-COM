"use client";

import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Package, Truck, Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  // Calculate an estimated delivery date (e.g., 5 days from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const formattedDate = deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-white pt-[10px] pb-20 px-6 xl:px-16 flex flex-col items-center justify-center">
      <div className="max-w-[600px] w-full flex flex-col items-center text-center">
        
        {/* Animated Checkmark */}
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 animate-[bounce_1s_ease-in-out]">
          <CheckCircle2 size={48} className="text-green-500" strokeWidth={2} />
        </div>

        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-black mb-4">
          Order Confirmed
        </h1>
        
        <p className="text-sm text-gray-500 font-semibold mb-10 max-w-[400px] leading-relaxed">
          Thank you for your purchase! We've received your order and are getting it ready for shipment.
        </p>

        {/* Order Details Card */}
        <div className="w-full bg-gray-50 border border-gray-200 rounded-sm p-6 mb-10 text-left">
          <div className="grid grid-cols-2 gap-6">
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Package size={12} /> Order Number
              </span>
              <span className="text-sm font-bold text-black">{orderId || 'Pending...'}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Calendar size={12} /> Date Placed
              </span>
              <span className="text-sm font-bold text-black">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <div className="col-span-2 border-t border-gray-200 pt-4 mt-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Truck size={12} /> Estimated Delivery
                </span>
                <span className="text-base font-black text-green-600">By {formattedDate}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-[400px]">
          <Link 
            href="/profile?tab=orders"
            className="w-full py-4 text-center text-[11px] font-black uppercase tracking-widest border-2 border-black text-black hover:bg-gray-50 transition-colors"
          >
            Track Order
          </Link>
          <Link 
            href="/"
            className="w-full py-4 text-[11px] font-black uppercase tracking-widest bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group"
          >
            Continue Shopping
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
