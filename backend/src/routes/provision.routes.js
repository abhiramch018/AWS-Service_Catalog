const express = require('express');
const provisionController = require('../controllers/provision.controller');

const router = express.Router();

router.post('/', provisionController.create);
router.get('/', provisionController.list);
router.get('/:id', provisionController.getById);

module.exports = router;
