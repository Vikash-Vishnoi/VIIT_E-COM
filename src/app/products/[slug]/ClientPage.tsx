"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import ProductCard, { FormattedProduct } from "@/components/ProductCard";

type ProductDetails = {
  _id: string;
  productId: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  sellingPrice: number;
  category: string;
  subCategory?: string;
  subSubCategory?: string;
  badge?: string;
  colors: {
    colorName: string;
    images: { url: string; order: number }[];
    sizes: { size: string; quantity: number; sku: string }[];
  }[];
};

type ClientPageProps = {
  product: ProductDetails;
  similarProducts: FormattedProduct[];
};

export default function ClientPage({ product, similarProducts }: ClientPageProps) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(() => {
    const defaultSizes = product.colors[0]?.sizes || [];
    const firstAvailable = defaultSizes.find(s => s.quantity > 0);
    return firstAvailable ? firstAvailable.size : null;
  });
  const [quantity, setQuantity] = useState<number | "">(1);
  const [addingToCart, setAddingToCart] = useState(false);
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Sync with global wishlist cache
  useEffect(() => {
    const checkStatus = () => {
      const ids = (window as any).__wishlistIds;
      if (ids) {
        setIsWishlisted(ids.has(product._id));
      }
    };
    checkStatus();
    window.addEventListener('wishlist-loaded', checkStatus);
    window.addEventListener('wishlist-change', checkStatus);
    return () => {
      window.removeEventListener('wishlist-loaded', checkStatus);
      window.removeEventListener('wishlist-change', checkStatus);
    };
  }, [product._id]);

  const toggleWishlist = async () => {
    setLoadingWishlist(true);
    
    // Optimistic update
    const previousState = isWishlisted;
    setIsWishlisted(!previousState);

    try {
      const res = await fetch('/api/user/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: product._id,
          // If they haven't explicitly picked a color/size yet, the API handles fallbacks, 
          // but let's pass what we have
          colorName: product.colors[selectedColorIndex]?.colorName,
          size: selectedSize || undefined
        })
      });
      const data = await res.json();
      
      if (data.success) {
        if ((window as any).__wishlistIds) {
          if (data.action === 'added') {
            (window as any).__wishlistIds.add(product._id);
          } else {
            (window as any).__wishlistIds.delete(product._id);
          }
        }
        window.dispatchEvent(new CustomEvent('wishlist-change', { detail: { action: data.action, productId: product._id } }));
      } else if (data.message === 'Unauthorized') {
        setIsWishlisted(previousState);
        sessionStorage.setItem('pendingWishlistAction', product._id);
        window.location.href = `/login?returnTo=/products/${product.slug}`;
      } else {
        setIsWishlisted(previousState);
      }
    } catch (error) {
      setIsWishlisted(previousState);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) return;
    
    setAddingToCart(true);
    
    const payload = {
      productId: product._id,
      colorName: product.colors[selectedColorIndex]?.colorName,
      size: selectedSize,
      quantity: typeof quantity === "number" ? quantity : 1
    };

    try {
      const res = await fetch('/api/user/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        window.dispatchEvent(new Event('cart-change'));
        // Keep button disabled briefly to show feedback
        setTimeout(() => setAddingToCart(false), 500);
      } else if (data.message === 'Unauthorized') {
        sessionStorage.setItem('pendingCartAction', JSON.stringify(payload));
        window.location.href = `/login?returnTo=/products/${product.slug}`;
      } else {
        setAddingToCart(false);
      }
    } catch (error) {
      setAddingToCart(false);
    }
  };

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<string>("details");

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? "" : id);
  };

  const currentColor = product.colors[selectedColorIndex] || product.colors[0];
  const images = currentColor?.images.sort((a, b) => a.order - b.order) || [];
  const sizes = currentColor?.sizes || [];
  const currentSizeObj = sizes.find(s => s.size === selectedSize);
  const displaySku = currentSizeObj?.sku || sizes[0]?.sku || product.productId;

  // Carousel ref and scroll function
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth;
      carouselRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Share functionality with SEO tracking
  const handleShare = async () => {
    // Add UTM parameters to track traffic originating from this share
    const shareUrl = `${window.location.origin}/products/${product.slug}?utm_source=user_share&utm_medium=web&utm_campaign=product_share`;
    const shareData = {
      title: `${product.title} | VIIT`,
      text: `Check out this amazing ${product.title} on VIIT!`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Product link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0">
      {/* ── Breadcrumb ── */}
      <div className="px-3 md:px-10 xl:px-16 pt-5 md:pt-8 pb-3 md:pb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-widest text-gray-400">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <span className="text-black font-bold truncate max-w-[200px] md:max-w-none">{product.title}</span>
        </nav>
      </div>

      <div className="px-0 md:px-10 xl:px-16 pb-0 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          
          {/* ── Left side: Image Gallery ── */}
          <div className="lg:col-span-7 flex md:grid flex-nowrap md:grid-cols-2 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-0 md:gap-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-[3/4] w-full flex-shrink-0 snap-center bg-gray-50 overflow-hidden">
                <Image
                  src={img.url || "https://tse4.mm.bing.net/th/id/OIP.z2thg6aE_lahXOHgvUsv7gHaHa"}
                  alt={`${product.title} - ${currentColor.colorName} - ${idx + 1}`}
                  fill
                  priority={idx < 2}
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>

          {/* ── Right side: Sticky Info Panel ── */}
          <div className="lg:col-span-5 sticky top-24 flex flex-col gap-5 md:gap-6 px-4 md:px-0 pt-4 md:pt-0">
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] md:text-xs font-black tracking-widest uppercase text-gray-500">
                {product.subSubCategory ? product.subSubCategory.replace(/-/g, ' ') : product.category}
              </span>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wide text-black leading-snug">
                  {product.title}
                </h1>
                <div className="flex items-center gap-1">
                  <button className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" aria-label="Add to wishlist">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                  <button onClick={handleShare} className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" aria-label="Share product">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-lg font-bold text-black">
                  ₹{product.sellingPrice.toLocaleString("en-IN")}
                </span>
                {product.price > product.sellingPrice && (
                  <span className="text-sm font-semibold text-gray-400 line-through">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-bold mt-[-4px]">
                MRP incl. of all taxes
              </p>
            </div>

            {/* Colors (if multiple) */}
            {product.colors.length > 1 && (
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">
                  Color: <span className="text-black">{currentColor.colorName}</span>
                </span>
                <div className="flex gap-2">
                  {product.colors.map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedColorIndex(idx);
                        const newSizes = product.colors[idx]?.sizes || [];
                        const firstAvailable = newSizes.find(s => s.quantity > 0);
                        setSelectedSize(firstAvailable ? firstAvailable.size : null);
                      }}
                      className={`w-12 h-16 relative rounded-sm overflow-hidden border-2 transition-all ${
                        selectedColorIndex === idx ? "border-black" : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <Image
                        src={c.images[0]?.url || "https://tse4.mm.bing.net/th/id/OIP.z2thg6aE_lahXOHgvUsv7gHaHa"}
                        alt={c.colorName}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">
                  Size
                </span>
                <button className="text-[10px] md:text-xs font-black uppercase tracking-widest underline underline-offset-4 hover:opacity-60 transition-opacity">
                  Size Guide
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {sizes.map((s) => {
                  const isOutOfStock = s.quantity === 0;
                  const isSelected = selectedSize === s.size;
                  return (
                    <button
                      key={s.size}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedSize(s.size)}
                      className={`relative w-14 h-12 flex items-center justify-center text-xs md:text-sm font-bold tracking-widest border transition-all ${
                        isOutOfStock
                          ? "opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400"
                          : isSelected
                          ? "bg-black text-white border-black"
                          : "bg-white text-black border-gray-200 hover:border-black"
                      }`}
                    >
                      {s.size}
                      {isOutOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center overflow-hidden">
                          <span className="w-[150%] h-px bg-gray-300 rotate-45 transform origin-center"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {!selectedSize && sizes.some(s => s.quantity > 0) && (
                <p className="text-[10px] md:text-xs font-bold text-red-500 tracking-wider">Please select a size.</p>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">
                Quantity
              </span>
              <div className="flex items-center border border-gray-200 w-32 h-12">
                <button
                  disabled={quantity === "" || quantity <= 1}
                  onClick={() => setQuantity(q => q === "" ? 1 : Math.max(1, q - 1))}
                  className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setQuantity("");
                    } else {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0) setQuantity(val);
                    }
                  }}
                  onBlur={() => {
                    if (quantity === "") setQuantity(1);
                  }}
                  className="flex-1 h-full w-full text-center text-sm font-bold focus:outline-none focus:bg-gray-50 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  style={{ MozAppearance: 'textfield' }}
                />
                <button
                  onClick={() => setQuantity(q => q === "" ? 2 : q + 1)}
                  className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Action Buttons (Desktop) */}
            <div className="hidden md:flex gap-4 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || addingToCart}
                className={`flex-1 py-4 text-sm font-black uppercase tracking-[0.2em] transition-all ${
                  selectedSize && !addingToCart
                    ? "bg-black text-white hover:bg-gray-800"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {addingToCart ? "ADDING..." : "Add To Bag"}
              </button>
            </div>

            {/* Features (Shipping/Fashion) */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-y border-gray-100 py-6 mt-4">
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Fresh Fashion</span>
              </div>
            </div>

            {/* Accordions */}
            <div className="flex flex-col border-b border-gray-100">
              <AccordionItem 
                id="details" 
                title="Product Details and Overview" 
                isOpen={openAccordion === "details"} 
                onClick={() => toggleAccordion("details")}
              >
                <div className="text-xs md:text-sm leading-relaxed text-gray-600 space-y-4">
                  <p>{product.description}</p>
                  <p className="font-semibold text-gray-400 pt-2 border-t border-gray-100">Style ID: {displaySku}</p>
                </div>
              </AccordionItem>
              
              <AccordionItem 
                id="delivery" 
                title="Delivery & Return" 
                isOpen={openAccordion === "delivery"} 
                onClick={() => toggleAccordion("delivery")}
              >
                <p className="text-xs md:text-sm leading-relaxed text-gray-600">
                  Standard delivery takes 3-5 business days. Free shipping on orders over ₹1,999.
                  <br /><br />
                  You have 15 days from the shipping date to return your purchase. The items must have all their labels and be in perfect condition.
                </p>
              </AccordionItem>

              <AccordionItem 
                id="contact" 
                title="Contact Us" 
                isOpen={openAccordion === "contact"} 
                onClick={() => toggleAccordion("contact")}
              >
                <p className="text-xs md:text-sm leading-relaxed text-gray-600">
                  Need help? Reach out to our customer support.
                  <br /><br />
                  Email: support@viit.com<br />
                  Phone: 1800-123-4567<br />
                  Hours: Mon-Fri, 9:00 AM - 6:00 PM
                </p>
              </AccordionItem>
            </div>

          </div>
        </div>
      </div>

      {/* ── Similar Products ── */}
      {similarProducts.length > 0 && (
        <div className="px-3 md:px-10 xl:px-16 py-12 md:py-16 bg-white border-t border-gray-100 relative">
          <div className="flex flex-col gap-8">
            <h2 className="text-xl font-bold uppercase tracking-widest text-black">
              Similar Products
            </h2>
            
            <div className="relative group/carousel">
              {/* Left Arrow */}
              <button 
                onClick={() => scrollCarousel('left')} 
                className="hidden md:flex absolute left-[-40px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center text-gray-300 hover:text-black transition-colors" 
                aria-label="Scroll left"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>

              {/* Scrollable carousel */}
              <div ref={carouselRef} className="flex overflow-x-auto gap-5 pb-4 snap-x" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {similarProducts.map((p) => (
                  <div key={p.id} className="w-[85vw] sm:w-[calc(50%-10px)] md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)] flex-shrink-0 snap-start">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>

              {/* Right Arrow */}
              <button 
                onClick={() => scrollCarousel('right')} 
                className="hidden md:flex absolute right-[-40px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center text-gray-300 hover:text-black transition-colors" 
                aria-label="Scroll right"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Mobile Add To Bag Bar ───────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-3 pb-safe shadow-[0_-8px_20px_rgba(0,0,0,0.04)] z-50 flex items-center justify-between gap-4">
        <div className="flex flex-col flex-1 pl-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Price</span>
          <span className="text-base font-black text-black leading-none mt-1">₹{product.sellingPrice.toLocaleString("en-IN")}</span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={addingToCart}
          className={`w-[65%] py-4 text-xs font-black uppercase tracking-widest transition-all ${
            addingToCart
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : selectedSize
              ? "bg-black text-white hover:bg-gray-800 active:scale-[0.98]"
              : "bg-gray-100 text-black border border-black/10 active:scale-[0.98]"
          }`}
        >
          {addingToCart ? "Adding..." : selectedSize ? "Add To Bag" : "Select A Size First"}
        </button>
      </div>
    </div>
  );
}

// Sub-component for Accordion
function AccordionItem({ id, title, isOpen, onClick, children }: { id: string, title: string, isOpen: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-100">
      <button 
        onClick={onClick}
        className="w-full flex items-center justify-between py-5 text-left transition-colors hover:bg-gray-50/50"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-black">{title}</span>
        <svg 
          className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[500px] opacity-100 pb-5" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
