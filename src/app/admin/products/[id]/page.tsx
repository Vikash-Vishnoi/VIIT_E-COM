"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2, ArrowLeft, Upload, X, Loader2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Size = { size: string; quantity: number | string; sku: string };
type ProductImage = { url: string; order: number; file?: File; isLocal?: boolean };
type ColorVariant = { colorName: string; images: ProductImage[]; sizes: Size[] };

type CategoryNode = {
  _id: string;
  label: string;
  slug: string;
  level: number;
  parentId: string | null;
};

type FormData = {
  title: string;
  description: string;
  category: string;
  subCategory: string;
  subSubCategory: string;
  price: number | string;
  sellingPrice: number | string;
  badge: string;
  isFeatured: boolean;
  isActive: boolean;
  colors: ColorVariant[];
};

const generateSKU = (title: string, color: string, size: string, existingSku: string) => {
  const getInitials = (str: string) =>
    str.trim().split(/\s+/).map((word) => word[0]?.toUpperCase()).join("").slice(0, 3);
  const t = getInitials(title || "PRD");
  const c = getInitials(color || "COL");
  const s = size.toUpperCase().replace(/[^A-Z0-9]/g, "") || "SZ";
  const hexMatch = existingSku.match(/-([0-9A-F]{4})$/);
  const hex = hexMatch
    ? hexMatch[1]
    : Math.random().toString(16).slice(2, 6).toUpperCase().padStart(4, "0");
  return `VIIT-${t}-${c}-${s}-${hex}`;
};

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [formData, setFormData] = useState<FormData>({
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
    colors: [],
  });

  const [allCategories, setAllCategories] = useState<CategoryNode[]>([]);

  // ─── Fetch product + categories on mount ─────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [productRes, catRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch("/api/admin/categories"),
        ]);

        const productJson = await productRes.json();
        const catJson = await catRes.json();

        if (!productJson.success) {
          setPageError(productJson.message || "Product not found");
          return;
        }

        const p = productJson.data;
        const mapped: FormData = {
          title: p.title ?? "",
          description: p.description ?? "",
          category: (p.category ?? "").toLowerCase(),
          subCategory: (p.subCategory ?? "").toLowerCase(),
          subSubCategory: (p.subSubCategory ?? "").toLowerCase(),
          price: p.price ?? 0,
          sellingPrice: p.sellingPrice ?? 0,
          badge: p.badge ?? "",
          isFeatured: p.isFeatured ?? false,
          isActive: p.isActive ?? true,
          colors: (p.colors ?? []).map((c: ColorVariant) => ({
            colorName: c.colorName,
            images: (c.images ?? []).map((img: ProductImage) => ({ url: img.url, order: img.order })),
            sizes: (c.sizes ?? []).map((sz: Size) => ({ size: sz.size, quantity: sz.quantity, sku: sz.sku })),
          })),
        };

        setFormData(mapped);
        setOriginalData(JSON.parse(JSON.stringify(mapped))); // deep clone

        if (catJson.success) setAllCategories(catJson.data);
      } catch (err) {
        setPageError("Failed to load product data");
      } finally {
        setPageLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  // ─── Derived category lists ───────────────────────────────────────
  const mainCategories = allCategories.filter((c) => c.level === 0);
  const selectedMain = allCategories.find((c) => c.slug === formData.category && c.level === 0);
  const subCategories = selectedMain
    ? allCategories.filter((c) => c.level === 1 && c.parentId === selectedMain._id)
    : [];
  const selectedSub = allCategories.find((c) => c.slug === formData.subCategory && c.level === 1);
  const subSubCategories = selectedSub
    ? allCategories.filter((c) => c.level === 2 && c.parentId === selectedSub._id)
    : [];

  // ─── Basic field change ───────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      let newValue: string | number | boolean;
      if (type === "checkbox") {
        newValue = (e.target as HTMLInputElement).checked;
      } else if (type === "number") {
        newValue = value === "" ? "" : Number(value);
      } else {
        newValue = value;
      }

      if (name === "title") {
        const newColors = prev.colors.map((color) => ({
          ...color,
          sizes: color.sizes.map((size) => ({
            ...size,
            sku: generateSKU(value, color.colorName, size.size, size.sku),
          })),
        }));
        return { ...prev, [name]: newValue, colors: newColors } as FormData;
      }

      return { ...prev, [name]: newValue } as FormData;
    });
  };

  // ─── Colors ──────────────────────────────────────────────────────
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
        sizes: newColors[colorIndex].sizes.map((size) => ({
          ...size,
          sku: generateSKU(prev.title, value, size.size, size.sku),
        })),
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

  const handleSizeChange = (
    colorIndex: number,
    sizeIndex: number,
    field: keyof Size,
    value: string | number
  ) => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      const newSizes = [...newColors[colorIndex].sizes];
      newSizes[sizeIndex] = { ...newSizes[sizeIndex], [field]: value };
      if (field === "size") {
        newSizes[sizeIndex].sku = generateSKU(
          prev.title,
          newColors[colorIndex].colorName,
          value as string,
          newSizes[sizeIndex].sku
        );
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
      const existingFiles = newImages.filter(img => img.isLocal && img.file).map(img => img.file as File);
      
      const uniqueFilesToAdd = Array.from(files).filter(file => {
        return !existingFiles.some(existing => existing.name === file.name && existing.size === file.size);
      });

      const filesToAdd = uniqueFilesToAdd.slice(0, spaceLeft);
      if (filesToAdd.length === 0) return prev;

      filesToAdd.forEach((file) => {
        newImages.push({ url: URL.createObjectURL(file), order: newImages.length, file, isLocal: true });
      });
      newColors[colorIndex] = { ...newColors[colorIndex], images: newImages };
      return { ...prev, colors: newColors };
    });
  };

  const removeImage = (colorIndex: number, imgIndex: number) => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      const filtered = newColors[colorIndex].images.filter((_, i) => i !== imgIndex);
      newColors[colorIndex] = {
        ...newColors[colorIndex],
        images: filtered.map((img, i) => ({ ...img, order: i })),
      };
      return { ...prev, colors: newColors };
    });
  };

  const moveImage = (colorIndex: number, imgIndex: number, direction: "left" | "right") => {
    setFormData((prev) => {
      const newColors = [...prev.colors];
      const imgs = [...newColors[colorIndex].images];
      if (direction === "left" && imgIndex > 0) {
        [imgs[imgIndex - 1], imgs[imgIndex]] = [imgs[imgIndex], imgs[imgIndex - 1]];
      } else if (direction === "right" && imgIndex < imgs.length - 1) {
        [imgs[imgIndex + 1], imgs[imgIndex]] = [imgs[imgIndex], imgs[imgIndex + 1]];
      }
      newColors[colorIndex] = {
        ...newColors[colorIndex],
        images: imgs.map((img, i) => ({ ...img, order: i })),
      };
      return { ...prev, colors: newColors };
    });
  };

  // ─── Build diff — only send changed fields ────────────────────────
  const buildPatch = (current: FormData, original: FormData): Partial<FormData> => {
    const patch: Partial<FormData> = {};
    const scalars: (keyof FormData)[] = [
      "title", "description", "category", "subCategory", "subSubCategory",
      "price", "sellingPrice", "badge", "isFeatured", "isActive",
    ];
    for (const key of scalars) {
      if (current[key] !== original[key]) {
        (patch as Record<string, unknown>)[key] = current[key];
      }
    }
    // Always include colors — comparing deep equality is complex and images may have been reordered/added/removed
    if (JSON.stringify(current.colors) !== JSON.stringify(original.colors)) {
      patch.colors = current.colors;
    }
    return patch;
  };

  // ─── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const current = formData;

      if (!current.title || current.title.trim().length < 3 || current.title.trim().length > 150) {
        setSaveError("Title must be between 3 and 150 characters.");
        setSaving(false);
        return;
      }
      if (!current.description || current.description.trim().length < 10 || current.description.trim().length > 5000) {
        setSaveError("Description must be between 10 and 5000 characters.");
        setSaving(false);
        return;
      }

      if (Number(current.price) < Number(current.sellingPrice)) {
        setSaveError("Regular price must be greater than or equal to the selling price.");
        setSaving(false);
        return;
      }
      if (current.colors.length === 0) {
        setSaveError("You must add at least one color variant.");
        setSaving(false);
        return;
      }
      for (const color of current.colors) {
        if (color.images.length === 0) {
          setSaveError(`You must upload at least one image for ${color.colorName} color.`);
          setSaving(false);
          return;
        }
        if (color.sizes.length === 0) {
          setSaveError(`You must add at least one size for ${color.colorName} color.`);
          setSaving(false);
          return;
        }
      }

      // Upload any new local images to Cloudinary first
      const payload = {
        ...current,
        colors: current.colors.map((c) => ({ ...c, images: [...c.images] })),
      };

      const uploadPromises: Promise<void>[] = [];
      for (let i = 0; i < payload.colors.length; i++) {
        for (let j = 0; j < payload.colors[i].images.length; j++) {
          const img = payload.colors[i].images[j];
          if (img.isLocal && img.file) {
            const form = new FormData();
            form.append("file", img.file);
            const capture = { i, j };
            uploadPromises.push(
              fetch("/api/admin/upload", { method: "POST", body: form })
                .then((r) => r.json())
                .then((data) => {
                  if (data.success) {
                    payload.colors[capture.i].images[capture.j] = {
                      url: data.url,
                      order: img.order,
                    };
                  } else {
                    throw new Error("Image upload failed");
                  }
                })
            );
          }
        }
      }
      if (uploadPromises.length > 0) await Promise.all(uploadPromises);

      // Build diff against original
      const patchBody = buildPatch(payload as FormData, originalData!);

      if (Object.keys(patchBody).length === 0) {
        setSaveError("No changes detected.");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });

      const data = await res.json();
      if (data.success) {
        // Update original to reflect saved state
        setOriginalData(JSON.parse(JSON.stringify(payload)));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(data.message || "Failed to update product");
      }
    } catch {
      setSaveError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading state ────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/products" className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div className="h-7 w-48 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-4 animate-pulse">
                <div className="h-4 w-32 bg-gray-100 rounded" />
                <div className="h-10 bg-gray-100 rounded-xl" />
                <div className="h-24 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200/60 rounded-2xl p-6 animate-pulse">
                <div className="h-4 w-24 bg-gray-100 rounded mb-4" />
                <div className="h-10 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────
  if (pageError) {
    return (
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto flex flex-col items-center justify-center py-32">
        <AlertTriangle size={48} strokeWidth={1} className="text-red-300 mb-4" />
        <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">{pageError}</p>
        <Link
          href="/admin/products"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Products
        </Link>
      </div>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-black"
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-black">Edit Product</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
              {formData.title || "Untitled"}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleSubmit()}
          disabled={saving}
          className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>

      {/* Feedback banners */}
      {saveError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
          <AlertTriangle size={16} className="flex-shrink-0" />
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium">
          ✓ Product updated successfully.
        </div>
      )}

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-8" onSubmit={handleSubmit}>

        {/* ── Left Column ── */}
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
                minLength={3}
                maxLength={150}
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
                minLength={10}
                maxLength={5000}
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Write a compelling product description..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-sm resize-none"
              />
            </div>
          </div>

          {/* Color Variants */}
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
                  <div key={colorIdx} className="p-5 rounded-xl border border-gray-200 bg-gray-50/30 space-y-5 relative">
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
                            <Image src={img.url} alt="Uploaded" fill className="object-cover" unoptimized={img.isLocal} />
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
                                onClick={() => moveImage(colorIdx, imgIdx, "left")}
                                disabled={imgIdx === 0}
                                className="bg-white/90 p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-gray-700"
                              >
                                <ChevronLeft size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveImage(colorIdx, imgIdx, "right")}
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
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                onChange={(e) => handleSizeChange(colorIdx, sizeIdx, "quantity", e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-24 px-3 py-1.5 text-sm font-bold border border-gray-200 rounded-lg outline-none focus:border-black"
                              />
                              <input
                                type="text"
                                readOnly
                                title="SKU is automatically generated"
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

        {/* ── Right Column ── */}
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value,
                    subCategory: "",
                    subSubCategory: "",
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-bold cursor-pointer uppercase tracking-wider"
              >
                <option value="" disabled>Select Main Category</option>
                {mainCategories.map((c) => (
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    subCategory: e.target.value,
                    subSubCategory: "",
                  }))
                }
                disabled={!formData.category}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>Select Sub Category</option>
                {subCategories.map((c) => (
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
                disabled={!formData.subCategory}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>Select Sub-Sub Category</option>
                {subSubCategories.map((c) => (
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
                Regular Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                name="sellingPrice"
                required
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-black text-sm text-green-600"
              />
            </div>
          </div>

          {/* Status */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2">Status & Visibility</h2>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-10 h-5 rounded-full transition-colors relative ${formData.isActive ? "bg-black" : "bg-gray-200"}`}>
                <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.isActive ? "left-6" : "left-1"}`} />
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
              <div className={`w-10 h-5 rounded-full transition-colors relative ${formData.isFeatured ? "bg-amber-400" : "bg-gray-200"}`}>
                <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.isFeatured ? "left-6" : "left-1"}`} />
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
