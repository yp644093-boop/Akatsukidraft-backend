import dotenv from 'dotenv';
dotenv.config();

// Helper to safely clean environment variables (strip whitespace and accidental quotes)
const cleanEnv = (val) => {
  if (!val || typeof val !== 'string') return val;
  const trimmed = val.trim();
  return trimmed.replace(/^["'](.*)["']$/, '$1');
};

const rawMongoUri = cleanEnv(process.env.MONGODB_URI);

const config = {
  port: parseInt(cleanEnv(process.env.PORT) || '5000', 10),
  mongoUri: rawMongoUri || 'mongodb://localhost:27017/akatsuki_draft',
  jwtSecret: cleanEnv(process.env.JWT_SECRET) || 'fallback_dev_secret',
  jwtExpiresIn: '1d',
  clientUrl: cleanEnv(process.env.CLIENT_URL) || 'http://localhost:5173',
  cloudinary: {
    cloudName: cleanEnv(process.env.CLOUDINARY_CLOUD_NAME),
    apiKey: cleanEnv(process.env.CLOUDINARY_API_KEY),
    apiSecret: cleanEnv(process.env.CLOUDINARY_API_SECRET),
  },
  openRouter: {
    apiKey: cleanEnv(process.env.OPENROUTER_API_KEY),
    model: cleanEnv(process.env.OPENROUTER_MODEL) || 'recursive/flint-v1.0:free',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
};

// Safe diagnostic helper (reports status without exposing secrets)
export const getEnvDiagnostics = () => {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    isVercel: Boolean(process.env.VERCEL),
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    isMongoUriAtlas: Boolean(rawMongoUri && rawMongoUri.startsWith('mongodb+srv://')),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasCloudinary: Boolean(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret),
    hasOpenRouter: Boolean(config.openRouter.apiKey),
  };
};

export default config;
