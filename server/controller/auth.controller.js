import User from '../model/user.model.js';
import generateToken from '../utils/generateToken.js';

// POST /api/auth/register (supports role: 'user' or 'admin')
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Role-based registration: default to 'user', allow 'admin' if requested
    const assignedRole = role === 'admin' ? 'admin' : 'user';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole
    });

    const token = generateToken({ id: user._id, role: user.role, email: user.email });

    res.status(201).json({
      success: true,
      message: `${assignedRole === 'admin' ? 'Admin' : 'User'} registered successfully`,
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/admin/register (Dedicated Admin Registration)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin'
    });

    const token = generateToken({ id: admin._id, role: admin.role, email: admin.email });

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: { user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login (Standard User Login)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken({ id: user._id, role: user.role, email: user.email });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/admin/login or /api/admin/login (Separate Admin Login)
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Role verification: user must have admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin credentials required' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken({ id: user._id, role: user.role, email: user.email });

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
};

export default { register, registerAdmin, login, adminLogin, getMe };
