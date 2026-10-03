const mongoose = require('mongoose');
const User = require('../models/User');
const ProvisionRequest = require('../models/ProvisionRequest');
const { ADMIN_ROLE } = require('../config/admin');

function createdAt(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value || '';
}

async function provisionRecords() {
  const requests = await ProvisionRequest.find().sort({ requestedAt: -1 }).lean();
  const ids = [
    ...new Set(requests.map((item) => item.userId).filter((id) => mongoose.isValidObjectId(id))),
  ];
  const users = ids.length
    ? await User.find({ _id: { $in: ids } }).select('name email').lean()
    : [];
  const owners = new Map(users.map((user) => [String(user._id), user]));

  return requests.map((request) => {
    const owner = request.userId ? owners.get(String(request.userId)) : null;
    return {
      user: owner?.name || request.requestedBy || '',
      email: owner?.email || '',
      requestId: request.requestId,
      product: request.product,
      environment: request.environment,
      provisionedProduct: request.provisionedProductName || '',
      status: request.status,
      createdAt: createdAt(request.requestedAt),
    };
  });
}

async function dashboard() {
  const [totalUsers, requests] = await Promise.all([
    User.countDocuments({ role: { $ne: ADMIN_ROLE } }),
    provisionRecords(),
  ]);

  return {
    totalUsers,
    totalProvisioningRequests: requests.length,
    activeProvisionedResources: requests.filter(
      (item) => item.status === 'AVAILABLE' || item.status === 'PROVISIONING',
    ).length,
    successfulRequests: requests.filter((item) => item.status === 'AVAILABLE').length,
    requests,
  };
}

module.exports = { dashboard, provisionRecords };
