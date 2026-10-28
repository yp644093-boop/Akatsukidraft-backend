import cloudinaryService from '../services/cloudinary.service.js';

// POST /api/upload/image
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const result = await cloudinaryService.uploadImageToCloudinary(req.file.buffer);

    res.status(201).json({
      success: true,
      message: 'Image uploaded',
      data: { url: result.secureUrl, publicId: result.publicId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/upload/document
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file provided' });
    }

    res.status(201).json({
      success: true,
      message: 'Document received',
      data: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { uploadImage, uploadDocument };
