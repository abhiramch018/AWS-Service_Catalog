const express = require('express');
const networkController = require('../controllers/network.controller');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/vpcs', requireAuth, networkController.listVpcs);
router.get('/subnets', requireAuth, networkController.listSubnets);

module.exports = router;
