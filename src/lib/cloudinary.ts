/**
 * Cloudinary server-side configuration.
 * This file is ONLY imported in server-side code (API routes, Server Actions).
 * Never import this in client components — it exposes API_SECRET.
 */

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true, // always use https URLs
});

export default cloudinary;
