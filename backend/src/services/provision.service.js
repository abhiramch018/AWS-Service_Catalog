const productService = require('./product.service');
const catalogAws = require('./catalogAws.service');
const networkService = require('./network.service');
const { profileFor } = require('./productProfiles');
const { portalMode } = require('../config/aws');
const ProvisionRequest = require('../models/ProvisionRequest');

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

  const { _id, userId, ...request } = document;
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

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function normalizeRequest(product, input = {}) {
  const profile = profileFor(product);
  if (!profile) {
    throw httpError('This product cannot be provisioned from the portal.', 400);
  }

  const environment = requiredText(input.environment, 'Environment');
  if (!profile.environments.includes(environment)) {
    throw httpError(
      profile.key === 's3'
        ? 'Select Development, Testing, or Production.'
        : 'Select Development, Test, or Production.',
      400,
    );
  }

  const selection = {
    environment,
    instanceType: '',
    region: '',
    subnet: '',
    vpc: '',
  };

  if (profile.fields.includes('instanceType')) {
    selection.instanceType = requiredText(input.instanceType, 'Instance type');
    if (!profile.instanceTypes.includes(selection.instanceType)) {
      throw httpError('Instance type must be t3.micro or t2.micro.', 400);
    }
  }
  if (profile.fields.includes('region')) {
    selection.region = requiredText(input.region, 'Region');
  }
  if (profile.fields.includes('vpc')) {
    selection.vpc = requiredText(input.vpc, 'VPC');
  }
  if (profile.fields.includes('subnet')) {
    selection.subnet = requiredText(input.subnet, 'Subnet');
  }
  if (profile.fields.includes('vpc')) {
    await networkService.assertSelection(selection);
  }

  return selection;
}

async function create(input = {}, actor = {}) {
  if (!actor.id) {
    throw httpError('Authentication is required.', 401);
  }

  const product = await productService.getById(input.productId);
  if (!product) {
    const error = new Error('Product not found.');
    error.status = 404;
    throw error;
  }

  const requestId = await nextRequestId();
  const { environment, instanceType, region, subnet, vpc } = await normalizeRequest(product, input);
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
    userId: String(actor.id),
    requestedBy: String(actor.name || 'Portal user').slice(0, 80),
    requestedAt: new Date(),
    message,
    provisionedProductId,
    provisionedProductName,
  });

  return toRequest(record.toObject());
}

async function list(userId) {
  const records = await ProvisionRequest.find({ userId: String(userId || '') }).sort({ requestedAt: -1 });
  return Promise.all(
    records.map((record) =>
      record.mode === 'aws' ? withAwsStatus(record.toObject()) : withDemoStatus(record.toObject()),
    ),
  );
}

async function getById(requestId, userId) {
  const record = await ProvisionRequest.findOne({ requestId, userId: String(userId || '') }).lean();
  if (record?.mode === 'aws') {
    return withAwsStatus(record);
  }
  return withDemoStatus(record);
}

module.exports = { create, list, getById, normalizeRequest };
