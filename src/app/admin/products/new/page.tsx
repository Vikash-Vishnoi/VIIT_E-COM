"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2, ArrowLeft, Upload, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Size = { size: string; quantity: number; sku: string };
type ProductImage = { url: string; order: number; file?: File; isLocal?: boolean };
type ColorVariant = { colorName: string; images: ProductImage[]; sizes: Size[] };

type CategoryNode = {
  _id: string;
  label: string;
  slug: string;
  level: number;
  parentId: string | null;
};

const generateSKU = (title: string, color: string, size: string, existingSku: string) => {
  const getInitials = (str: string) => str.trim().split(/\s+/).map(word => word[0]?.toUpperCase()).join('').slice(0, 3);
  const t = getInitials(title || 'PRD');
  const c = getInitials(color || 'COL');
  const s = size.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'SZ';
  const hexMatch = existingSku.match(/-([0-9A-F]{4})$/);
  const hex = hexMatch ? hexMatch[1] : Math.random().toString(16).slice(2, 6).toUpperCase().padStart(4, '0');
  return `VIIT-${t}-${c}-${s}-${hex}`;
};

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    subSubCategory: "",
    price: 0,
    sellingPrice: 0,
    badge: "",
    isFeatured: false,
    isActive: true,
    colors: [] as ColorVariant[],
  });

  const [allCategories, setAllCategories] = useState<CategoryNode[]>([]);

  const LOCAL_STORAGE_KEY = "admin_new_product_draft_v2";
  const [isMounted, setIsMounted] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === "object") {
          // Normalize old uppercase drafts to match lowercase slugs
          if (parsed.category) parsed.category = parsed.category.toLowerCase();
          if (parsed.subCategory) parsed.subCategory = parsed.subCategory.toLowerCase();
          if (parsed.subSubCategory) parsed.subSubCategory = parsed.subSubCategory.toLowerCase();
          setFormData(parsed);
        }
      } catch (err) {
        console.error("Failed to parse saved product draft");
      }
    }

    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/admin/categories");
        const json = await res.json();
        if (json.success) setAllCategories(json.data);
      } catch (err) {
        console.error("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, []);

  // Save to LocalStorage when formData changes
  useEffect(() => {
    if (isMounted) {
      // Strip out local files/previews before saving
      const dataToSave = {
        ...formData,
        colors: formData.colors.map(c => ({
          ...c,
          images: c.images.filter(img => !img.isLocal)
        }))
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [formData, isMounted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const newValue: string | number | boolean = type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? Number(value) : value;
      
      if (name === "title") {
        const newColors = prev.colors.map(color => ({
          ...color,
          sizes: color.sizes.map(size => ({
            ...size,
            sku: generateSKU(value, color.colorName, size.size, size.sku)
          }))
        }));
        return { ...prev, [name]: newValue, colors: newColors } as typeof prev;
      }
      
      return {
        ...prev,
        [name]: newValue,
      } as typeof prev;
    });
  };

  // ─── Colors & Variants ───────────────────────────────────────────
  const addColor = () => {
    setFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, { colorName: "", images: [], sizes: [] }],
    }));
  };

  const removeColor = (colorIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== colorIndex),
    }));
  };

  const handleColorNameChange = (colorIndex: number, value: string) => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      newColors[colorIndex] = { 
        ...newColors[colorIndex], 
        colorName: value,
        sizes: newColors[colorIndex].sizes.map(size => ({
          ...size,
          sku: generateSKU(prev.title, value, size.size, size.sku)
        }))
      };
      return { ...prev, colors: newColors };
    });
  };

  // ─── Sizes ───────────────────────────────────────────────────────
  const addSize = (colorIndex: number) => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      const newSku = generateSKU(prev.title, newColors[colorIndex].colorName, "", "");
      newColors[colorIndex] = {
        ...newColors[colorIndex],
        sizes: [...newColors[colorIndex].sizes, { size: "", quantity: 0, sku: newSku }],
      };
      return { ...prev, colors: newColors };
    });
  };

  const removeSize = (colorIndex: number, sizeIndex: number) => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      newColors[colorIndex] = {
        ...newColors[colorIndex],
        sizes: newColors[colorIndex].sizes.filter((_, i) => i !== sizeIndex),
      };
      return { ...prev, colors: newColors };
    });
  };

  const handleSizeChange = (colorIndex: number, sizeIndex: number, field: keyof Size, value: string | number) => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      const newSizes = [...newColors[colorIndex].sizes];
      newSizes[sizeIndex] = { ...newSizes[sizeIndex], [field]: value };
      
      if (field === "size") {
        newSizes[sizeIndex].sku = generateSKU(prev.title, newColors[colorIndex].colorName, value as string, newSizes[sizeIndex].sku);
      }
      
      newColors[colorIndex] = { ...newColors[colorIndex], sizes: newSizes };
      return { ...prev, colors: newColors };
    });
  };

  // ─── Images ──────────────────────────────────────────────────────
  const handleFileUpload = (colorIndex: number, files: FileList) => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      const newImages = [...newColors[colorIndex].images];
      
      const spaceLeft = 8 - newImages.length;
      if (spaceLeft <= 0) return prev;

      const filesToAdd = Array.from(files).slice(0, spaceLeft);

      filesToAdd.forEach((file) => {
        const previewUrl = URL.createObjectURL(file);
        newImages.push({ url: previewUrl, order: newImages.length, file, isLocal: true });
      });

      newColors[colorIndex] = { ...newColors[colorIndex], images: newImages };
      return { ...prev, colors: newColors };
    });
  };

  const removeImage = (colorIndex: number, imgIndex: number) => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      const filteredImages = newColors[colorIndex].images.filter((_, i) => i !== imgIndex);
      const reorderedImages = filteredImages.map((img, i) => ({ ...img, order: i }));
      newColors[colorIndex] = { ...newColors[colorIndex], images: reorderedImages };
      return { ...prev, colors: newColors };
    });
  };

  const moveImage = (colorIndex: number, imgIndex: number, direction: 'left' | 'right') => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      const newImages = [...newColors[colorIndex].images];
      
      if (direction === 'left' && imgIndex > 0) {
        const temp = newImages[imgIndex - 1];
        newImages[imgIndex - 1] = newImages[imgIndex];
        newImages[imgIndex] = temp;
      } else if (direction === 'right' && imgIndex < newImages.length - 1) {
        const temp = newImages[imgIndex + 1];
        newImages[imgIndex + 1] = newImages[imgIndex];
        newImages[imgIndex] = temp;
      }
      
      const reorderedImages = newImages.map((img, i) => ({ ...img, order: i }));
      newColors[colorIndex] = { ...newColors[colorIndex], images: reorderedImages };
      return { ...prev, colors: newColors };
    });
  };

  // ─── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = { ...formData };

      if (payload.price < payload.sellingPrice) {
        setError("Regular price must be greater than or equal to the selling price.");
        setLoading(false);
        return;
      }

      if (payload.colors.length === 0) {
        setError("You must add at least one color variant.");
        setLoading(false);
        return;
      }

      for (const color of payload.colors) {
        if (color.images.length === 0) {
          setError(`You must upload at least one image for the '${color.colorName}' color.`);
          setLoading(false);
          return;
        }
        if (color.sizes.length === 0) {
          setError(`You must add at least one size for the '${color.colorName}' color.`);
          setLoading(false);
          return;
        }
      }

      // 1. Upload local images to Cloudinary in parallel
      const uploadPromises: Promise<void>[] = [];

      for (let i = 0; i < payload.colors.length; i++) {
        const color = payload.colors[i];
        for (let j = 0; j < color.images.length; j++) {
          const img = color.images[j];
          if (img.isLocal && img.file) {
            const form = new FormData();
            form.append("file", img.file);
            
            const uploadPromise = fetch("/api/admin/upload", { method: "POST", body: form })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  color.images[j] = { url: data.url, order: img.order };
                } else {
                  throw new Error("Image upload failed");
                }
              });
              
            uploadPromises.push(uploadPromise);
          }
        }
      }

      // Wait for all image uploads to complete simultaneously
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      // 2. Submit product
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        router.push("/admin/products");
      } else {
        setError(data.message || "Failed to create product");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const mainCategories = allCategories.filter((c) => c.level === 0);
  const selectedMain = allCategories.find((c) => c.slug === formData.category && c.level === 0);
  const subCategories = selectedMain
    ? allCategories.filter((c) => c.level === 1 && c.parentId === selectedMain._id)
    : [];
  const selectedSub = allCategories.find((c) => c.slug === formData.subCategory && c.level === 1);
  const subSubCategories = selectedSub
    ? allCategories.filter((c) => c.level === 2 && c.parentId === selectedSub._id)
    : [];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-8">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-black"
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-black">Add New Product</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
              Create a new catalog entry
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Product
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-8" onSubmit={handleSubmit}>
        
        {/* ── Left Column (Main Info & Variants) ────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic Info */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2">Basic Information</h2>
            
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Product Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Vintage Denim Jacket"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Description *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Write a compelling product description..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-sm resize-none"
              />
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Color Variants & Sizes</h2>
              <button
                type="button"
                onClick={addColor}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                <Plus size={14} /> Add Color
              </button>
            </div>

            {formData.colors.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400 text-sm font-medium">No color variants added yet.</p>
                <p className="text-gray-400 text-xs mt-1">Products must have at least one color and size.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.colors.map((color, colorIdx) => (
                  <div key={colorIdx} className="p-5 rounded-xl border border-gray-200 bg-gray-50/30 space-y-5 relative group">
                    <button
                      type="button"
                      onClick={() => removeColor(colorIdx)}
                      className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Color Name */}
                    <div className="pr-10">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                        Color Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={color.colorName}
                        onChange={(e) => handleColorNameChange(colorIdx, e.target.value)}
                        placeholder="e.g. Midnight Blue"
                        className="w-full max-w-[250px] px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-black outline-none text-sm font-bold"
                      />
                    </div>

                    {/* Images */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                        Images *
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {color.images.map((img, imgIdx) => (
                          <div key={imgIdx} className="relative w-20 h-24 rounded-lg overflow-hidden border border-gray-200 group/img bg-white">
                            <Image src={img.url} alt="Uploaded" fill className="object-cover" />
                            <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-black px-1.5 py-0.5 rounded backdrop-blur-sm z-10 shadow-sm">
                              #{img.order + 1}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(colorIdx, imgIdx)}
                              className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded hover:bg-red-50 opacity-0 group-hover/img:opacity-100 transition-opacity z-10 shadow-sm"
                            >
                              <X size={12} />
                            </button>
                            <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
                              <button
                                type="button"
                                onClick={() => moveImage(colorIdx, imgIdx, 'left')}
                                disabled={imgIdx === 0}
                                className="bg-white/90 p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-gray-700"
                              >
                                <ChevronLeft size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveImage(colorIdx, imgIdx, 'right')}
                                disabled={imgIdx === color.images.length - 1}
                                className="bg-white/90 p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-gray-700"
                              >
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {color.images.length < 8 && (
                          <label className="w-20 h-24 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 hover:text-black">
                            <Upload size={20} className="mb-1" />
                            <span className="text-[9px] font-bold uppercase">Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) handleFileUpload(colorIdx, files);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Sizes */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          Sizes & Inventory *
                        </label>
                      </div>

                      {color.sizes.length === 0 ? (
                        <p className="text-xs text-red-500 font-medium">Please add at least one size.</p>
                      ) : (
                        <div className="space-y-2">
                          {color.sizes.map((size, sizeIdx) => (
                            <div key={sizeIdx} className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                placeholder="Size (e.g. M)"
                                required
                                value={size.size}
                                onChange={(e) => handleSizeChange(colorIdx, sizeIdx, "size", e.target.value)}
                                className="w-20 px-3 py-1.5 text-sm font-bold border border-gray-200 rounded-lg outline-none focus:border-black"
                              />
                              <input
                                type="number"
                                placeholder="Qty"
                                required
                                min="0"
                                value={size.quantity}
                                onChange={(e) => handleSizeChange(colorIdx, sizeIdx, "quantity", Number(e.target.value))}
                                className="w-24 px-3 py-1.5 text-sm font-bold border border-gray-200 rounded-lg outline-none focus:border-black"
                              />
                              <input
                                type="text"
                                placeholder="SKU (Auto)"
                                readOnly
                                title="SKU is automatically generated to ensure uniqueness"
                                value={size.sku}
                                className="flex-1 min-w-[120px] px-3 py-1.5 text-sm font-mono border border-gray-200 rounded-lg outline-none bg-gray-50/50 text-gray-500 cursor-not-allowed"
                              />
                              <button
                                type="button"
                                onClick={() => removeSize(colorIdx, sizeIdx)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => addSize(colorIdx)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 mt-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-400 hover:text-black text-[10px] font-bold uppercase tracking-widest transition-all w-full shadow-sm"
                      >
                        <Plus size={14} /> Add Size
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column (Organization & Pricing) ─────────────── */}
        <div className="space-y-8">
          
          {/* Organization */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2">Organization</h2>
            
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Main Category *
              </label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={(e) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    category: e.target.value, 
                    subCategory: "", 
                    subSubCategory: "" 
                  }));
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-bold cursor-pointer uppercase tracking-wider"
              >
                <option value="" disabled>Select Main Category</option>
                {mainCategories.map(c => (
                  <option key={c._id} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Sub Category *
              </label>
              <select
                name="subCategory"
                required
                value={formData.subCategory}
                onChange={(e) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    subCategory: e.target.value, 
                    subSubCategory: "" 
                  }));
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-medium cursor-pointer"
                disabled={!formData.category}
              >
                <option value="" disabled>Select Sub Category</option>
                {subCategories.map(c => (
                  <option key={c._id} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Sub-Sub Category *
              </label>
              <select
                name="subSubCategory"
                required
                value={formData.subSubCategory}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-medium cursor-pointer"
                disabled={!formData.subCategory}
              >
                <option value="" disabled>Select Sub-Sub Category</option>
                {subSubCategories.map(c => (
                  <option key={c._id} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Badge
              </label>
              <select
                name="badge"
                value={formData.badge}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
              >
                <option value="">None</option>
                <option value="New">New</option>
                <option value="Sale">Sale</option>
                <option value="Best Seller">Best Seller</option>
                <option value="Limited">Limited</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2">Pricing</h2>
            
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Regular Price ($) *
              </label>
              <input
                type="number"
                name="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Selling Price ($) *
              </label>
              <input
                type="number"
                name="sellingPrice"
                required
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm text-green-600"
              />
            </div>
          </div>

          {/* Status */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2">Status & Visibility</h2>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-10 h-5 rounded-full transition-colors relative ${formData.isActive ? 'bg-black' : 'bg-gray-200'}`}>
                <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.isActive ? 'left-6' : 'left-1'}`} />
              </div>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="hidden"
              />
              <span className="text-sm font-bold text-gray-700 group-hover:text-black">Active Product</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-10 h-5 rounded-full transition-colors relative ${formData.isFeatured ? 'bg-amber-400' : 'bg-gray-200'}`}>
                <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.isFeatured ? 'left-6' : 'left-1'}`} />
              </div>
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="hidden"
              />
              <span className="text-sm font-bold text-gray-700 group-hover:text-black">Featured Product</span>
            </label>
          </div>

        </div>
      </form>
    </div>
  );
}
