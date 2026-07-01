import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center bg-gray-50 px-4 md:px-6 py-20 text-center">
      <div className="flex flex-col items-center max-w-lg w-full">
        {/* Massive 404 Text */}
        <h1 className="text-[120px] md:text-[180px] leading-none font-black text-black tracking-tighter">
          404
        </h1>
        
        {/* Subtitle */}
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-black mt-2 mb-4">
          Page Not Found
        </h2>
        
        {/* Explanation */}
        <p className="text-sm md:text-base text-gray-500 font-medium mb-10 leading-relaxed max-w-md">
          The item or page you're looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>

        {/* Action Button */}
        <Link 
          href="/"
          className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 md:py-4 bg-black text-white text-xs md:text-sm font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
