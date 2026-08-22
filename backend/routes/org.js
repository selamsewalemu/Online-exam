const express = require('express');
const router = express.Router();
const {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getClasses, createClass, updateClass, deleteClass, manageClassStudents,
  getCourses, createCourse, updateCourse, deleteCourse,
} = require('../controllers/orgController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Departments — admin only
router.get('/departments', getDepartments);
router.post('/departments', authorize('admin'), createDepartment);
router.put('/departments/:id', authorize('admin'), updateDepartment);
router.delete('/departments/:id', authorize('admin'), deleteDepartment);

// Classes — admin manages, teacher reads own
router.get('/classes', getClasses);
router.post('/classes', authorize('admin'), createClass);
router.put('/classes/:id', authorize('admin'), updateClass);
router.delete('/classes/:id', authorize('admin'), deleteClass);
router.put('/classes/:id/students', authorize('admin'), manageClassStudents);

// Courses — all roles read, admin/teacher manage
router.get('/courses', getCourses);
router.post('/courses', authorize('admin'), createCourse);
router.put('/courses/:id', authorize('admin'), updateCourse);
router.delete('/courses/:id', authorize('admin'), deleteCourse);

module.exports = router;
