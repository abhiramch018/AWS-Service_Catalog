const productService = require('../services/product.service');

async function list(req, res) {
  try {
    const products = await productService.list();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Products could not be loaded.' });
  }
}

async function create(req, res) {
  try {
    const product = await productService.create(req.body || {});
    res.status(201).json(product);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'The product could not be saved.',
    });
  }
}

async function getById(req, res) {
  try {
    const product = await productService.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: 'This product could not be loaded.' });
  }
}

module.exports = { list, getById, create };
