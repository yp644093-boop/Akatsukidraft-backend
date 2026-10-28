import jwt from 'jsonwebtoken';
import config from '../config/env.js';

// Generate a JWT for the given payload
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

export default generateToken;
