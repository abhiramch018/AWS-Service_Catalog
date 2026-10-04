// Restricted products are hidden until an admin approves a ProductRequest.
// Set RDS_POSTGRESQL_PRODUCT_ID to the real Service Catalog product id when it exists.
// This file does not create AWS products, portfolios, or templates.

const REQUESTABLE_PRODUCTS = [
  {
    id: process.env.RDS_POSTGRESQL_PRODUCT_ID || 'prod-rds-postgresql',
    name: 'RDS PostgreSQL',
    description: 'PostgreSQL database requested through the portal and provisioned from AWS Service Catalog after approval.',
    category: 'Database',
    environments: ['Development', 'Testing', 'Production'],
  },
];

function requestableProducts() {
  return REQUESTABLE_PRODUCTS.map((product) => ({ ...product }));
}

function requestableById(productId) {
  const id = String(productId || '').trim();
  return REQUESTABLE_PRODUCTS.find((product) => product.id === id) || null;
}

function isRestrictedProduct(product) {
  const id = String(product?.id || product || '').trim();
  const name = String(product?.name || '').trim().toLowerCase();
  return REQUESTABLE_PRODUCTS.some(
    (item) => item.id === id || item.name.toLowerCase() === name,
  );
}

function portalProduct(item) {
  return {
    id: item.id,
    name: item.name,
    version: '1.0',
    category: item.category,
    status: 'Approved',
    description: item.description,
    provider: 'AWS Service Catalog',
    infrastructure: {
      ec2Instance: 'Defined in the Service Catalog CloudFormation template',
      securityGroup: 'Defined in the Service Catalog CloudFormation template',
      cloudFormationTemplate: 'CloudFormation',
      environment: 'Development',
    },
  };
}

module.exports = {
  requestableProducts,
  requestableById,
  isRestrictedProduct,
  portalProduct,
};
