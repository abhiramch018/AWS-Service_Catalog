const Product = require('../models/Product');
const { portalMode } = require('../config/aws');
const catalogAws = require('./catalogAws.service');

function toProduct(document) {
  if (!document) {
    return null;
  }

  const { _id, ...product } = document;
  return product;
}

async function list() {
  if (portalMode() === 'aws') {
    return catalogAws.listProducts();
  }

  const products = await Product.find().sort({ id: 1 }).lean();
  return products.map(toProduct);
}

async function getById(id) {
  if (portalMode() === 'aws') {
    return catalogAws.getProduct(id);
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
