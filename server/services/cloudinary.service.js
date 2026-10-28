import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';

// Upload a file buffer to Cloudinary
export const uploadImageToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const folder = options.folder || 'akatsuki_drafts/posts';
    const uniqueId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id: uniqueId, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );

    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);
    stream.pipe(uploadStream);
  });
};

// Delete an image from Cloudinary by public ID
export const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    console.warn(`[Cloudinary] Could not delete ${publicId}: ${error.message}`);
  }
};

export default { uploadImageToCloudinary, deleteImageFromCloudinary };
