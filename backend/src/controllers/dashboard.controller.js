const dashboardService = require('../services/dashboard.service');

async function getSummary(req, res) {
  try {
    const summary = await dashboardService.getSummary(req.user);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'The dashboard could not be loaded.' });
  }
}

module.exports = { getSummary };
