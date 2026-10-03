const productService = require('./product.service');
const provisionService = require('./provision.service');
const { portalMode } = require('../config/aws');

async function getSummary(actor = {}) {
  const products = await productService.list();
  const requests = await provisionService.list(actor.id);

  return {
    mode: portalMode(),
    approvedProducts: products.filter((product) => product.status === 'Approved').length,
    provisioningRequests: requests.length,
    activeProvisionedResources: requests.filter((request) => request.status === 'PROVISIONING').length,
    successfulRequests: requests.filter((request) => request.status === 'AVAILABLE').length,
  };
}

module.exports = { getSummary };
