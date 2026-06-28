import sanitizeHtml from 'sanitize-html';
import mongoose from 'mongoose';

export const validateTitle = (title: any): { isValid: boolean, value?: string, error?: string } => {
  const safeTitle = typeof title === 'string' ? title.trim() : '';
  if (safeTitle.length < 3 || safeTitle.length > 150) {
    return { isValid: false, error: 'Title must be between 3 and 150 characters' };
  }
  return { isValid: true, value: safeTitle };
}; 

export const validateDescription = (description: any): { isValid: boolean, value?: string, error?: string } => {
  const safeDesc = typeof description === 'string' ? description.trim() : '';
  if (safeDesc.length < 10 || safeDesc.length > 5000) {
    return { isValid: false, error: 'Description must be between 10 and 5000 characters' };
  }
  return { isValid: true, value: sanitizeHtml(safeDesc) };
};

export const validatePrice = (price: any): { isValid: boolean, value?: number, error?: string } => {
  const p = Number(price);
  if (isNaN(p) || p <= 0) {
    return { isValid: false, error: 'Price must be a valid number greater than 0' };
  }
  return { isValid: true, value: p };
};

export const validateObjectId = (id: string, resourceName: string = 'product'): { isValid: boolean, error?: string } => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { isValid: false, error: `Invalid ${resourceName} ID format` };
  }
  return { isValid: true };
};

export const validateCategory = (category: any, fieldName: string = 'Category'): { isValid: boolean, value?: string, error?: string } => {
  const safeCategory = typeof category === 'string' ? category.trim() : '';
  if (!safeCategory) {
    return { isValid: false, error: `${fieldName} is required and must be a valid string` };
  }
  return { isValid: true, value: safeCategory };
};

export const validateBadge = (badge: any): { isValid: boolean, value?: string, error?: string } => {
  if (badge === undefined || badge === null) return { isValid: true, value: '' };
  const validBadges = ['New', 'Sale', 'Best Seller', 'Limited', ''];
  const safeBadge = typeof badge === 'string' ? badge.trim() : '';
  if (safeBadge && !validBadges.includes(safeBadge)) return { isValid: false, error: 'Invalid badge value' };
  return { isValid: true, value: safeBadge };
};

export const validateBoolean = (val: any, fieldName: string): { isValid: boolean, value?: boolean, error?: string } => {
  if (typeof val !== 'boolean') return { isValid: false, error: `${fieldName} must be a boolean` };
  return { isValid: true, value: val };
};

export const validateColors = (colors: any): { isValid: boolean, value?: any[], error?: string } => {
  if (!Array.isArray(colors)) return { isValid: false, error: 'Colors must be an array' };

  // ── Length caps (checked BEFORE iterating to avoid processing huge arrays) ──
  if (colors.length === 0)  return { isValid: false, error: 'At least one color variant is required' };
  if (colors.length > 10)   return { isValid: false, error: 'A product can have at most 10 color variants' };

  // ── Image URL allowlist: only accept URLs from your own Cloudinary account ──
  const CLOUDINARY_BASE = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;

  const safeColors: any[] = [];

  for (const c of colors) {
    const safeColorName = typeof c.colorName === 'string' ? c.colorName.trim() : '';

    // ── Size cap ─────────────────────────────────────────────────────────────
    const rawSizes = Array.isArray(c.sizes) ? c.sizes : [];
    if (rawSizes.length > 20) {
      return { isValid: false, error: `Color "${safeColorName}" exceeds the maximum of 20 size variants` };
    }

    const sizes = rawSizes.map((s: any) => ({
      size:     typeof s.size === 'string' ? s.size.trim() : '',
      quantity: Number(s.quantity) || 0,
      sku:      typeof s.sku === 'string' ? s.sku : undefined,
    }));

    // ── Image URL validation ──────────────────────────────────────────────────
    const rawImages = Array.isArray(c.images) ? c.images : [];
    const images: { url: string; order: number }[] = [];

    for (const img of rawImages) {
      if (typeof img.url !== 'string' || !img.url.startsWith(CLOUDINARY_BASE)) {
        return { isValid: false, error: 'All product images must be uploaded through the platform upload tool' };
      }
      images.push({ url: img.url, order: Number(img.order) || 0 });
    }

    safeColors.push({ colorName: safeColorName, images, sizes });
  }

  return { isValid: true, value: safeColors };
};

export const validatePricing = (price: any, sellingPrice: any, existingProduct?: any): { isValid: boolean, price?: number, sellingPrice?: number, error?: string } => {
  let currentPrice = price !== undefined ? price : existingProduct?.price;
  let currentSellingPrice = sellingPrice !== undefined ? sellingPrice : existingProduct?.sellingPrice;
  
  const pResult = validatePrice(currentPrice);
  if (!pResult.isValid) return { isValid: false, error: pResult.error };
  
  const spResult = validatePrice(currentSellingPrice);
  if (!spResult.isValid) return { isValid: false, error: 'Selling price must be a valid number greater than 0' };
  
  if (pResult.value! < spResult.value!) {
    return { isValid: false, error: 'Regular price must be greater than or equal to selling price' };
  }
  
  return { isValid: true, price: pResult.value, sellingPrice: spResult.value };
};
