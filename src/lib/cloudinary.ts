import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const deleteImageFromCloudinary = async (url: string) => {
  try {
    if (!url || !url.includes('cloudinary.com')) return false;

    const parts = url.split('/upload/');
    if (parts.length < 2) return false;

    let publicIdWithExt = parts[1];
    
    // Remove version folder if it exists (e.g. v1701234567/)
    if (publicIdWithExt.match(/^v\d+\//)) {
      publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, '');
    }

    // Remove file extension
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");

    if (publicId) {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    }
    return false;
  } catch (error) {
    console.error('Cloudinary delete error for URL:', url, error);
    return false;
  }
};

export default cloudinary;
