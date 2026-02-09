const express = require('express');
const { assignRole, getAllLogs, getAllUsers } = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

const router = express.Router();

router.post('/assign-role', authMiddleware, rbacMiddleware(['Admin']), assignRole);
router.get('/logs', authMiddleware, rbacMiddleware(['Admin']), getAllLogs);
router.get('/users', authMiddleware, rbacMiddleware(['Admin']), getAllUsers);

module.exports = router;
