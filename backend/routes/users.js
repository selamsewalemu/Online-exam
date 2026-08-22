const express = require('express');
const router = express.Router();
const {
  getUsers, getUser, createUser, updateUser, deleteUser,
  toggleUserStatus, updateUserRole, resetPassword, getUserActivity,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/toggle-status', toggleUserStatus);
router.put('/:id/role', updateUserRole);
router.put('/:id/reset-password', resetPassword);
router.get('/:id/activity', getUserActivity);

module.exports = router;
