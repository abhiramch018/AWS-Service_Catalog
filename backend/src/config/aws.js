const { ServiceCatalogClient } = require('@aws-sdk/client-service-catalog');

function portalMode() {
  return process.env.DEMO_MODE === 'true' ? 'demo' : 'aws';
}

function catalogClient() {
  const region = process.env.AWS_REGION;
  if (!region || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    const error = new Error(
      'AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY must be set in backend/.env.',
    );
    error.status = 500;
    throw error;
  }

  return new ServiceCatalogClient({ region });
}

function awsError(error) {
  const wrapped = new Error(error.message || 'AWS Service Catalog request failed.');
  wrapped.status = error.$metadata?.httpStatusCode === 400 ? 400 : 502;
  return wrapped;
}

module.exports = { portalMode, catalogClient, awsError };
