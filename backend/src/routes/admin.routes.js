const express = require('express');
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/requireAuth');

const router = express.Router();

router.post('/login', adminController.login);
router.get('/dashboard', requireAdmin, adminController.dashboard);
router.get('/provision', requireAdmin, adminController.provision);

module.exports = router;
