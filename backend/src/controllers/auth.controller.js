const authService = require('../services/auth.service');

async function register(req, res) {
  try {
    const result = await authService.register(req.body || {});
    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Account could not be created.',
    });
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body || {});
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Login failed.',
    });
  }
}

module.exports = { register, login };
