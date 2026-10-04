const ProductRequest = require('../models/ProductRequest');
const { requestableById, requestableProducts } = require('../config/requestableProducts');

const ENVIRONMENTS = ['Development', 'Testing', 'Production'];
const TEXT_LIMIT = 1000;

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function requiredText(value, label) {
  const text = String(value || '').trim();
  if (!text) {
    throw httpError(`${label} is required.`, 400);
  }
  if (text.length > TEXT_LIMIT) {
    throw httpError(`${label} must be ${TEXT_LIMIT} characters or fewer.`, 400);
  }
  return text;
}

function iso(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value || '';
}

function toRequest(document) {
  if (!document) {
    return null;
  }

  return {
    requestId: document.requestId,
    userName: document.userName,
    userEmail: document.userEmail,
    productId: document.productId,
    productName: document.productName,
    reason: document.reason,
    environment: document.environment,
    expectedUsage: document.expectedUsage,
    status: document.status,
    adminComment: document.adminComment || '',
    reviewedBy: document.reviewedBy || '',
    reviewedAt: iso(document.reviewedAt),
    createdAt: iso(document.createdAt),
    updatedAt: iso(document.updatedAt),
  };
}

async function nextRequestId() {
  const latest = await ProductRequest.findOne().sort({ requestId: -1 }).lean();
  const current = latest ? Number(String(latest.requestId).split('-').pop()) : 0;
  const next = Number.isFinite(current) ? current + 1 : 1;
  return `PREQ-2026-${String(next).padStart(3, '0')}`;
}

function options() {
  return requestableProducts().map((product) => ({
    id: product.id,
    name: product.name,
    environments: product.environments,
  }));
}

async function hasApproval(userId, productId) {
  const requestable = requestableById(productId);
  if (!requestable) {
    return true;
  }
  const approved = await ProductRequest.findOne({
    userId: String(userId || ''),
    productId: requestable.id,
    status: 'APPROVED',
  }).lean();
  return Boolean(approved);
}

async function create(input = {}, actor = {}) {
  if (!actor.id) {
    throw httpError('Authentication is required.', 401);
  }

  const product = requestableById(input.productId);
  if (!product) {
    throw httpError('This product cannot be requested.', 400);
  }
  if (!product.environments.includes(String(input.environment || '').trim())) {
    throw httpError('Select Development, Testing, or Production.', 400);
  }

  const reason = requiredText(input.reason, 'Reason');
  const expectedUsage = requiredText(input.expectedUsage, 'Expected usage');
  const existing = await ProductRequest.findOne({
    userId: String(actor.id),
    productId: product.id,
    status: { $in: ['PENDING', 'APPROVED'] },
  }).lean();

  if (existing?.status === 'PENDING') {
    throw httpError(`Your request for ${product.name} is already pending.`, 409);
  }
  if (existing?.status === 'APPROVED') {
    throw httpError(`Access to ${product.name} has already been approved.`, 409);
  }

  const record = await ProductRequest.create({
    requestId: await nextRequestId(),
    userId: String(actor.id),
    userName: String(actor.name || 'Portal user').slice(0, 80),
    userEmail: String(actor.email || ''),
    productId: product.id,
    productName: product.name,
    reason,
    environment: String(input.environment).trim(),
    expectedUsage,
    status: 'PENDING',
  });

  return toRequest(record.toObject());
}

async function listForUser(userId) {
  const records = await ProductRequest.find({ userId: String(userId || '') }).sort({ createdAt: -1 }).lean();
  return records.map(toRequest);
}

async function getForUser(requestId, userId) {
  const record = await ProductRequest.findOne({
    requestId,
    userId: String(userId || ''),
  }).lean();
  return toRequest(record);
}

async function listAll() {
  const records = await ProductRequest.find().sort({ createdAt: -1 }).lean();
  const pending = records.filter((record) => record.status === 'PENDING');
  const reviewed = records.filter((record) => record.status !== 'PENDING');
  return [...pending, ...reviewed].map(toRequest);
}

async function review(requestId, actor, status, adminComment) {
  if (!actor?.id) {
    throw httpError('Authentication is required.', 401);
  }

  const comment = String(adminComment || '').trim();
  if (comment.length > TEXT_LIMIT) {
    throw httpError(`Comment must be ${TEXT_LIMIT} characters or fewer.`, 400);
  }

  const updated = await ProductRequest.findOneAndUpdate(
    { requestId, status: 'PENDING' },
    {
      status,
      adminComment: comment,
      reviewedBy: String(actor.name || 'Admin').slice(0, 80),
      reviewedAt: new Date(),
    },
    { new: true },
  ).lean();

  if (updated) {
    return toRequest(updated);
  }

  const existing = await ProductRequest.findOne({ requestId }).lean();
  if (!existing) {
    throw httpError('Product request not found.', 404);
  }
  throw httpError('This request has already been reviewed.', 409);
}

function approve(requestId, actor, adminComment) {
  return review(requestId, actor, 'APPROVED', adminComment);
}

function reject(requestId, actor, adminComment) {
  return review(requestId, actor, 'REJECTED', adminComment);
}

module.exports = {
  options,
  hasApproval,
  create,
  listForUser,
  getForUser,
  listAll,
  approve,
  reject,
};
