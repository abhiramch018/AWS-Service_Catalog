const { ServiceCatalogClient } = require('@aws-sdk/client-service-catalog');

function portalMode() {
  return process.env.DEMO_MODE === 'true' ? 'demo' : 'aws';
}

function catalogClient() {
  const region = process.env.AWS_REGION;
  if (!region) {
    const error = new Error('AWS_REGION must be set.');
    error.status = 500;
    throw error;
  }

  // Region only. The SDK default credential chain supplies credentials:
  // environment variables locally, or the EC2 instance role in production.
  return new ServiceCatalogClient({ region });
}

function awsError(error) {
  const wrapped = new Error(error.message || 'AWS Service Catalog request failed.');
  wrapped.status = error.$metadata?.httpStatusCode === 400 ? 400 : 502;
  return wrapped;
}

module.exports = { portalMode, catalogClient, awsError };
