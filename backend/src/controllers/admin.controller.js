const authService = require('../services/auth.service');
const adminService = require('../services/admin.service');

async function login(req, res) {
  try {
    const result = await authService.adminLogin(req.body || {});
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Login failed.',
    });
  }
}

async function dashboard(req, res) {
  try {
    const summary = await adminService.dashboard();
    res.json(summary);
  } catch {
    res.status(500).json({ message: 'The admin dashboard could not be loaded.' });
  }
}

async function provision(req, res) {
  try {
    const requests = await adminService.provisionRecords();
    res.json(requests);
  } catch {
    res.status(500).json({ message: 'Provisioning records could not be loaded.' });
  }
}

module.exports = { login, dashboard, provision };
