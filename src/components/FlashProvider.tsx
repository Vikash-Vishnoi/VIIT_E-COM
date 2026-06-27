"use client";

import { Toaster } from "react-hot-toast";

export default function FlashProvider() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{
        // Push the toast down by 80px so it sits perfectly below the Header 
        // (which corresponds to the pt-20 padding on the <main> tag)
        top: 80, 
        right: 24,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '8px',
          background: '#ffffff',
          color: '#374151', // text-gray-700
          fontSize: '13px',
          fontWeight: '500',
          padding: '12px 20px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #f3f4f6', // border-gray-100
          whiteSpace: 'nowrap',
          maxWidth: 'none',
        },
        success: {
          iconTheme: {
            primary: '#10b981', // emerald-500
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444', // red-500
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}
