const Product = require('../models/Product');
const { portalMode } = require('../config/aws');
const catalogAws = require('./catalogAws.service');
const productRequestService = require('./productRequest.service');
const {
  isRestrictedProduct,
  portalProduct,
  requestableById,
  requestableProducts,
} = require('../config/requestableProducts');

function toProduct(document) {
  if (!document) {
    return null;
  }

  const { _id, ...product } = document;
  return product;
}

async function catalogProducts() {
  if (portalMode() === 'aws') {
    return catalogAws.listProducts();
  }

  const products = await Product.find().sort({ id: 1 }).lean();
  return products.map(toProduct);
}

async function visibleRestricted(userId, catalog) {
  const approved = [];
  for (const item of requestableProducts()) {
    const allowed = await productRequestService.hasApproval(userId, item.id);
    if (!allowed) {
      continue;
    }
    const remote = catalog.find(
      (product) => product.id === item.id || product.name.toLowerCase() === item.name.toLowerCase(),
    );
    approved.push(remote || portalProduct(item));
  }
  return approved;
}

async function list(userId) {
  const catalog = await catalogProducts();
  const open = catalog.filter((product) => !isRestrictedProduct(product));
  if (!userId) {
    return open;
  }
  const restricted = await visibleRestricted(userId, catalog);
  return [...open, ...restricted];
}

function accessError() {
  const error = new Error('You do not have access to this product.');
  error.status = 403;
  return error;
}

async function getById(id, userId) {
  const configured = requestableById(id);
  if (configured) {
    const allowed = await productRequestService.hasApproval(userId, configured.id);
    if (!allowed) {
      throw accessError();
    }
  }

  const remote = portalMode() === 'aws' ? await catalogAws.getProduct(id) : null;
  const requestable =
    configured ||
    requestableProducts().find(
      (item) => item.name.toLowerCase() === String(remote?.name || '').toLowerCase(),
    ) ||
    null;

  if (requestable && !configured) {
    const allowed = await productRequestService.hasApproval(userId, requestable.id);
    if (!allowed) {
      throw accessError();
    }
  }

  if (requestable) {
    if (remote && isRestrictedProduct(remote)) {
      return remote;
    }
    return portalProduct(requestable);
  }

  if (portalMode() === 'aws') {
    return remote;
  }

  const product = await Product.findOne({ id }).lean();
  return toProduct(product);
}

function requiredText(value, label) {
  const text = String(value || '').trim();
  if (!text) {
    const error = new Error(`${label} is required.`);
    error.status = 400;
    throw error;
  }
  return text;
}

async function create(input = {}) {
  if (portalMode() === 'aws') {
    const error = new Error('Products are managed in AWS Service Catalog.');
    error.status = 400;
    throw error;
  }

  const infrastructure = input.infrastructure || {};
  const product = await Product.create({
    id: `prod-${Date.now().toString(36)}`,
    name: requiredText(input.name, 'Product name'),
    version: requiredText(input.version, 'Version'),
    category: requiredText(input.category, 'Category'),
    status: 'Approved',
    description: requiredText(input.description, 'Description'),
    provider: requiredText(input.provider, 'Provider'),
    infrastructure: {
      ec2Instance: requiredText(infrastructure.ec2Instance, 'EC2 instance'),
      securityGroup: requiredText(infrastructure.securityGroup, 'Security Group'),
      cloudFormationTemplate: requiredText(
        infrastructure.cloudFormationTemplate,
        'CloudFormation template',
      ),
      environment: requiredText(infrastructure.environment, 'Environment'),
    },
  });

  return toProduct(product.toObject());
}

module.exports = { list, getById, create };
