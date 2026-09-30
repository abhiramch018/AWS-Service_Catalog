const provisionService = require('../services/provision.service');

async function create(req, res) {
  try {
    const record = await provisionService.create(req.body || {});
    res.status(201).json(record);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Provisioning request failed.',
    });
  }
}

async function list(req, res) {
  try {
    const requests = await provisionService.list();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Provisioning history could not be loaded.' });
  }
}

async function getById(req, res) {
  try {
    const record = await provisionService.getById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Provisioning request not found.' });
    }
    return res.json(record);
  } catch (error) {
    return res.status(500).json({ message: 'This request could not be loaded.' });
  }
}

module.exports = { create, list, getById };
