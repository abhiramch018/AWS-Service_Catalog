const express = require('express');
const provisionController = require('../controllers/provision.controller');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.post('/', requireAuth, provisionController.create);
router.get('/', requireAuth, provisionController.list);
router.get('/:id', requireAuth, provisionController.getById);

module.exports = router;
