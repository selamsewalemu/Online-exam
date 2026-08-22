const Department = require('../models/Department');
const Class = require('../models/Class');
const Course = require('../models/Course');
const User = require('../models/User');

// ─── DEPARTMENTS ─────────────────────────────────────────────────────────────

const getDepartments = async (req, res, next) => {
  try {
    const deps = await Department.find().sort({ name: 1 });
    res.json({ success: true, departments: deps });
  } catch (e) { next(e); }
};

const createDepartment = async (req, res, next) => {
  try {
    const dep = await Department.create(req.body);
    res.status(201).json({ success: true, department: dep });
  } catch (e) { next(e); }
};

const updateDepartment = async (req, res, next) => {
  try {
    const dep = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dep) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, department: dep });
  } catch (e) { next(e); }
};

const deleteDepartment = async (req, res, next) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Department deleted' });
  } catch (e) { next(e); }
};

// ─── CLASSES ─────────────────────────────────────────────────────────────────

const getClasses = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'teacher') filter.teachers = req.user._id;
    const classes = await Class.find(filter)
      .populate('department', 'name')
      .populate('teachers', 'name email')
      .sort({ name: 1 });
    res.json({ success: true, classes });
  } catch (e) { next(e); }
};

const createClass = async (req, res, next) => {
  try {
    const cls = await Class.create(req.body);
    res.status(201).json({ success: true, class: cls });
  } catch (e) { next(e); }
};

const updateClass = async (req, res, next) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('department', 'name');
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, class: cls });
  } catch (e) { next(e); }
};

const deleteClass = async (req, res, next) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Class deleted' });
  } catch (e) { next(e); }
};

// Add/remove student from class
const manageClassStudents = async (req, res, next) => {
  try {
    const { studentId, action } = req.body; // action: 'add' | 'remove'
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    if (action === 'add') {
      if (!cls.students.includes(studentId)) cls.students.push(studentId);
      await User.findByIdAndUpdate(studentId, { $addToSet: { enrolledClasses: cls._id } });
    } else {
      cls.students = cls.students.filter(s => s.toString() !== studentId);
      await User.findByIdAndUpdate(studentId, { $pull: { enrolledClasses: cls._id } });
    }
    await cls.save();
    res.json({ success: true, message: `Student ${action === 'add' ? 'added to' : 'removed from'} class` });
  } catch (e) { next(e); }
};

// ─── COURSES ─────────────────────────────────────────────────────────────────

const getCourses = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'teacher') filter.teachers = req.user._id;
    if (req.user.role === 'student') filter._id = { $in: req.user.enrolledCourses };
    const courses = await Course.find(filter)
      .populate('department', 'name')
      .populate('teachers', 'name email')
      .sort({ name: 1 });
    res.json({ success: true, courses });
  } catch (e) { next(e); }
};

const createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, course });
  } catch (e) { next(e); }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('department', 'name');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (e) { next(e); }
};

const deleteCourse = async (req, res, next) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Course deleted' });
  } catch (e) { next(e); }
};

module.exports = {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getClasses, createClass, updateClass, deleteClass, manageClassStudents,
  getCourses, createCourse, updateCourse, deleteCourse,
};
