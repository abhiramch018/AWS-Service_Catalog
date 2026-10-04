const express = require('express');
const productRequestController = require('../controllers/productRequest.controller');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/options', requireAuth, productRequestController.options);
router.get('/', requireAuth, productRequestController.list);
router.post('/', requireAuth, productRequestController.create);
router.get('/:id', requireAuth, productRequestController.getById);

module.exports = router;
