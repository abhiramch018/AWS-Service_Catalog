const productService = require('./product.service');
const catalogAws = require('./catalogAws.service');
const networkService = require('./network.service');
const { portalMode } = require('../config/aws');
const ProvisionRequest = require('../models/ProvisionRequest');

const ENVIRONMENTS = ['Development', 'Test', 'Production'];

const REQUESTED_MS = 4000;
const PROVISIONING_MS = 6000;

function requiredText(value, label) {
  const text = String(value || '').trim();
  if (!text) {
    const error = new Error(`${label} is required.`);
    error.status = 400;
    throw error;
  }
  return text;
}

function toRequest(document) {
  if (!document) {
    return null;
  }

  const { _id, ...request } = document;
  if (request.requestedAt instanceof Date) {
    request.requestedAt = request.requestedAt.toISOString();
  }
  return request;
}

async function withDemoStatus(document) {
  const request = toRequest(document);
  if (!request || request.status === 'FAILED' || request.status === 'AVAILABLE') {
    return request;
  }

  const elapsed = Date.now() - new Date(request.requestedAt).getTime();
  let status = 'REQUESTED';
  if (elapsed >= REQUESTED_MS + PROVISIONING_MS) {
    status = 'AVAILABLE';
  } else if (elapsed >= REQUESTED_MS) {
    status = 'PROVISIONING';
  }

  if (status !== request.status) {
    await ProvisionRequest.updateOne({ requestId: request.requestId }, { status });
    request.status = status;
  }

  return request;
}

async function nextRequestId() {
  const latest = await ProvisionRequest.findOne().sort({ requestId: -1 }).lean();
  const current = latest ? Number(String(latest.requestId).split('-').pop()) : 0;
  const next = Number.isFinite(current) ? current + 1 : 1;
  return `REQ-2026-${String(next).padStart(3, '0')}`;
}

async function withAwsStatus(document) {
  const request = toRequest(document);
  if (!request || !request.provisionedProductId || request.status === 'AVAILABLE' || request.status === 'FAILED') {
    return request;
  }

  const current = await catalogAws.provisionedStatus(request.provisionedProductId);
  if (current.status !== request.status || current.message !== request.message) {
    await ProvisionRequest.updateOne(
      { requestId: request.requestId },
      { status: current.status, message: current.message },
    );
    request.status = current.status;
    request.message = current.message;
  }

  return request;
}

async function create(input = {}) {
  const product = await productService.getById(input.productId);
  if (!product) {
    const error = new Error('Product not found.');
    error.status = 404;
    throw error;
  }

  const environment = requiredText(input.environment, 'Environment');
  if (!ENVIRONMENTS.includes(environment)) {
    const error = new Error('Select Development, Test, or Production.');
    error.status = 400;
    throw error;
  }

  const requestId = await nextRequestId();
  const instanceType = requiredText(input.instanceType, 'Instance type');
  const region = requiredText(input.region, 'Region');
  const subnet = requiredText(input.subnet, 'Subnet');
  const vpc = requiredText(input.vpc, 'VPC');
  await networkService.assertSelection({ region, vpc, subnet });
  const awsMode = portalMode() === 'aws';
  let provisionedProductId = '';
  let provisionedProductName = '';
  let status = 'REQUESTED';
  let message = 'Demo Mode — AWS resources are not being created.';

  if (awsMode) {
    provisionedProductName = `portal-${requestId}`.toLowerCase();
    const recordDetail = await catalogAws.provisionProduct(product.id, provisionedProductName, {
      environment,
      instanceType,
      region,
      subnet,
      vpc,
    });
    provisionedProductId = recordDetail.ProvisionedProductId || '';
    status = 'PROVISIONING';
    message = 'Provisioning requested through AWS Service Catalog.';
  }

  const record = await ProvisionRequest.create({
    requestId,
    status,
    mode: awsMode ? 'aws' : 'demo',
    productId: product.id,
    product: product.name,
    environment,
    instanceType,
    region,
    subnet,
    vpc,
    requestedBy: String(input.requestedBy || 'Portal user').slice(0, 80),
    requestedAt: new Date(),
    message,
    provisionedProductId,
    provisionedProductName,
  });

  return toRequest(record.toObject());
}

async function list() {
  const records = await ProvisionRequest.find().sort({ requestedAt: -1 });
  return Promise.all(
    records.map((record) =>
      record.mode === 'aws' ? withAwsStatus(record.toObject()) : withDemoStatus(record.toObject()),
    ),
  );
}

async function getById(requestId) {
  const record = await ProvisionRequest.findOne({ requestId }).lean();
  if (record?.mode === 'aws') {
    return withAwsStatus(record);
  }
  return withDemoStatus(record);
}

module.exports = { create, list, getById };
