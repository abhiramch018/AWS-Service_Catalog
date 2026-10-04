const express = require('express');
const adminController = require('../controllers/admin.controller');
const productRequestController = require('../controllers/productRequest.controller');
const { requireAdmin } = require('../middleware/requireAuth');

const router = express.Router();

router.post('/login', adminController.login);
router.get('/dashboard', requireAdmin, adminController.dashboard);
router.get('/provision', requireAdmin, adminController.provision);
router.get('/product-requests', requireAdmin, productRequestController.adminList);
router.patch('/product-requests/:id/approve', requireAdmin, productRequestController.approve);
router.patch('/product-requests/:id/reject', requireAdmin, productRequestController.reject);

module.exports = router;
