const productRequestService = require('../services/productRequest.service');

function sendError(res, error, fallback) {
  res.status(error.status || 500).json({
    message: error.message || fallback,
  });
}

async function options(req, res) {
  res.json(productRequestService.options());
}

async function create(req, res) {
  try {
    const record = await productRequestService.create(req.body || {}, req.user);
    res.status(201).json(record);
  } catch (error) {
    sendError(res, error, 'The product request could not be saved.');
  }
}

async function list(req, res) {
  try {
    const records = await productRequestService.listForUser(req.user.id);
    res.json(records);
  } catch (error) {
    sendError(res, error, 'Product requests could not be loaded.');
  }
}

async function getById(req, res) {
  try {
    const record = await productRequestService.getForUser(req.params.id, req.user.id);
    if (!record) {
      return res.status(404).json({ message: 'Product request not found.' });
    }
    return res.json(record);
  } catch (error) {
    return sendError(res, error, 'This product request could not be loaded.');
  }
}

async function adminList(req, res) {
  try {
    const records = await productRequestService.listAll();
    res.json(records);
  } catch (error) {
    sendError(res, error, 'Product requests could not be loaded.');
  }
}

async function approve(req, res) {
  try {
    const record = await productRequestService.approve(
      req.params.id,
      req.user,
      req.body?.adminComment,
    );
    res.json(record);
  } catch (error) {
    sendError(res, error, 'The product request could not be approved.');
  }
}

async function reject(req, res) {
  try {
    const record = await productRequestService.reject(
      req.params.id,
      req.user,
      req.body?.adminComment,
    );
    res.json(record);
  } catch (error) {
    sendError(res, error, 'The product request could not be rejected.');
  }
}

module.exports = { options, create, list, getById, adminList, approve, reject };
