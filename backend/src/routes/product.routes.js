const express = require('express');
const productController = require('../controllers/product.controller');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/', requireAuth, productController.list);
router.post('/', requireAuth, productController.create);
router.get('/:id', requireAuth, productController.getById);

module.exports = router;
