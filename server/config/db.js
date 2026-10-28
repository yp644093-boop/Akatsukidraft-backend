import mongoose from 'mongoose';
import config, { getEnvDiagnostics } from './env.js';

// Safe helper to extract cluster hostname without exposing username or password
export const getMaskedCluster = (uri) => {
  if (!uri) return 'NOT_CONFIGURED';
  try {
    const match = uri.match(/@([^/?#]+)/);
    return match ? match[1] : (uri.includes('localhost') ? 'localhost' : 'custom-host');
  } catch {
    return 'UNKNOWN';
  }
};

// Global cache for serverless environments (preserves connection across invocations)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  // 1. If already connected, return cached connection immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // 2. Safe diagnostic check on environment configuration
  const diagnostics = getEnvDiagnostics();
  if (!diagnostics.hasMongoUri) {
    console.warn('[DB Diagnostic] MONGODB_URI is NOT set in environment variables! Using fallback localhost.');
  }

  // 3. If a connection is already in progress, await the existing promise
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (err) {
      cached.promise = null;
      throw err;
    }
  }

  // 4. Initiate connection with serverless-optimized options
  const connectionOptions = {
    serverSelectionTimeoutMS: 10000, // 10s gives cold start TLS & DNS time without exceeding function limits
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,                      // Use IPv4, skip IPv6 resolution delays on cloud networks
    maxPoolSize: 10,
  };

  const maskedHost = getMaskedCluster(config.mongoUri);

  cached.promise = mongoose.connect(config.mongoUri, connectionOptions)
    .then((m) => {
      console.log(`[DB] Connected successfully to cluster: ${maskedHost}`);
      return m;
    })
    .catch((error) => {
      cached.promise = null; // Reset promise so next invocation can retry
      cached.conn = null;

      // Safe diagnostic error logging without exposing credentials or secrets
      console.error('[DB] Connection failed details:', {
        errorName: error.name || 'ConnectionError',
        errorCode: error.code || error.cause?.code || 'NO_CODE',
        targetCluster: maskedHost,
        message: error.message ? error.message.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') : 'Unknown error',
      });
      throw error;
    });

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
};

export const getConnectionStatus = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    state: stateMap[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    cluster: getMaskedCluster(config.mongoUri),
  };
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('[DB] Disconnected');
  }
};

export default connectDB;
