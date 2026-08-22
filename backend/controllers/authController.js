const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    // Self-registration only allowed as student
    const userRole = ['student'].includes(role) ? role : 'student';
    const user = await User.create({ name, email, password, role: userRole });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user: user.toSafeObject() });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    user.lastLogin = new Date();
    // Keep activity log trimmed to last 50
    user.activityLog.push({ action: 'login', ip: req.ip });
    if (user.activityLog.length > 50) user.activityLog.shift();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (error) { next(error); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department', 'name')
      .populate('enrolledCourses', 'name code')
      .populate('assignedCourses', 'name code');
    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, avatar, phone }, { new: true, runValidators: true });
    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) { next(error); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) { next(error); }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
