const User = require('../models/User');
const Result = require('../models/Result');
const generateToken = require('../utils/generateToken');

// GET /api/users  — Admin: all users; Teacher: only students in their classes
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter)
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, count: users.length, total, users });
  } catch (error) { next(error); }
};

// GET /api/users/:id
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department', 'name')
      .populate('enrolledCourses', 'name code')
      .populate('assignedCourses', 'name code')
      .populate('enrolledClasses', 'name code')
      .populate('assignedClasses', 'name code');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) { next(error); }
};

// POST /api/users  — Admin creates user with any role
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, studentId, employeeId } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password: password || 'Pass@1234', role, department, studentId, employeeId });
    res.status(201).json({ success: true, message: 'User created', user: user.toSafeObject() });
  } catch (error) { next(error); }
};

// PUT /api/users/:id  — Admin updates any user
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, department, studentId, employeeId, phone, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, studentId, employeeId, phone, isActive },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) { next(error); }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await user.deleteOne();
    res.json({ success: true, message: 'User deleted' });
  } catch (error) { next(error); }
};

// PUT /api/users/:id/toggle-status
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user: user.toSafeObject() });
  } catch (error) { next(error); }
};

// PUT /api/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'teacher', 'admin'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) { next(error); }
};

// PUT /api/users/:id/reset-password  — Admin resets password
const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = newPassword || 'Pass@1234';
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) { next(error); }
};

// GET /api/users/:id/activity
const getUserActivity = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('activityLog name email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, activityLog: user.activityLog });
  } catch (error) { next(error); }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, toggleUserStatus, updateUserRole, resetPassword, getUserActivity };
