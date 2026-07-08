import React from "react";

type OrderSummaryCardProps = {
  subtotal: number;
  title?: string;
  children?: React.ReactNode;
  headerContent?: React.ReactNode;
};

export default function OrderSummaryCard({
  subtotal,
  title = "Order Summary",
  children,
  headerContent,
}: OrderSummaryCardProps) {
  const taxAmount = Math.round(subtotal - subtotal / 1.18);
  const subtotalExclTax = subtotal - taxAmount;

  return (
    <div className="bg-white p-4 md:p-8 flex flex-col gap-5 md:gap-6 border-none md:border-solid md:border md:border-gray-200 shadow-none md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-none md:rounded-sm">
      <h2 className="hidden md:block text-lg font-black uppercase tracking-widest text-black mb-2 border-b border-gray-100 pb-4">
        {title}
      </h2>

      {headerContent}

      <div className="flex flex-col gap-4 md:gap-5 text-xs md:text-sm font-semibold text-gray-500 pt-2">
        <div className="flex justify-between items-center">
          <span>Subtotal (Excl. Tax)</span>
          <span className="text-black font-bold">₹{subtotalExclTax.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Estimated Tax (18% GST)</span>
          <span className="text-black font-bold">₹{taxAmount.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Estimated Shipping</span>
          <span className="text-green-600 uppercase tracking-wider text-[10px] md:text-xs font-black bg-green-50 px-2 py-1 rounded-sm">
            Free
          </span>
        </div>
      </div>

      <div className="flex justify-between items-end pt-5 md:pt-6 border-t border-gray-100 mt-1 md:mt-2">
        <div className="flex flex-col">
          <span className="text-sm md:text-base font-black uppercase tracking-wide text-black">
            Total
          </span>
          <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
            Incl. of all taxes
          </span>
        </div>
        <span className="text-xl md:text-2xl font-black text-black leading-none">
          ₹{subtotal.toLocaleString("en-IN")}
        </span>
      </div>

      {children}
    </div>
  );
}
