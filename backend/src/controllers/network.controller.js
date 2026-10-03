const networkService = require('../services/network.service');

async function listVpcs(req, res) {
  try {
    const result = await networkService.listVpcs();
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'VPCs could not be loaded.',
    });
  }
}

async function listSubnets(req, res) {
  try {
    const result = await networkService.listSubnets(req.query.vpcId);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Subnets could not be loaded.',
    });
  }
}

module.exports = { listVpcs, listSubnets };
