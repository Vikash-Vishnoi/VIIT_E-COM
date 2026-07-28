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

    const price = Number(c.price);
    const sellingPrice = Number(c.sellingPrice);
    
    if (isNaN(price) || price <= 0) {
      return { isValid: false, error: 'price must be > 0' };
    }
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      return { isValid: false, error: 'sellingPrice must be > 0' };
    }
    if (price < sellingPrice) {
      return { isValid: false, error: 'price must be >= sellingPrice' };
    }

    const badgeRes = validateBadge(c.badge);
    if (!badgeRes.isValid) return { isValid: false, error: `Color "${safeColorName}": ${badgeRes.error}` };

    const isFeatured = typeof c.isFeatured === 'boolean' ? c.isFeatured : false;
    const isActive = typeof c.isActive === 'boolean' ? c.isActive : true;
    
    // Ratings are not validated from input because they are calculated/internal, 
    // but if passed we could sanitize. For safety, just strip them or allow them.
    // In our case, admin APIs don't typically let you set ratings directly from the form.
    
    safeColors.push({
      colorName: safeColorName,
      price,
      sellingPrice,
      images,
      sizes,
      badge: badgeRes.value || null,
      isFeatured,
      isActive,
      // ratings are preserved if present (e.g. on updates)
      ...(c.ratings && { ratings: c.ratings }),
      ...(c.popularityScore !== undefined && { popularityScore: c.popularityScore }),
    });
  }

  return { isValid: true, value: safeColors };
};

