const EC2_PRODUCT_ID = 'prod-jrgcrbhgoxw24';
const S3_PRODUCT_ID = 'prod-ctdwlxj3ybi5g';

const PROFILES = {
  ec2: {
    key: 'ec2',
    id: EC2_PRODUCT_ID,
    name: 'Development EC2',
    fields: ['environment', 'instanceType', 'region', 'vpc', 'subnet'],
    environments: ['Development', 'Test', 'Production'],
    instanceTypes: ['t3.micro', 't2.micro'],
  },
  s3: {
    key: 's3',
    id: S3_PRODUCT_ID,
    name: 'S3 Storage',
    fields: ['environment'],
    environments: ['Development', 'Testing', 'Production'],
    instanceTypes: [],
  },
};

function profileFor(product = {}) {
  const id = String(product.id || '');
  const name = String(product.name || '').trim().toLowerCase();
  if (id === PROFILES.ec2.id || name === 'development ec2') {
    return PROFILES.ec2;
  }
  if (id === PROFILES.s3.id || name === 's3 storage') {
    return PROFILES.s3;
  }
  return null;
}

function catalogEnvironment(profile, value) {
  const text = String(value || '').trim();
  if (profile?.key === 's3') {
    return profile.environments.find((item) => item.toLowerCase() === text.toLowerCase()) || '';
  }

  const mapped = {
    development: 'development',
    test: 'staging',
    staging: 'staging',
  };
  return mapped[text.toLowerCase()] || '';
}

function environmentError(profile) {
  if (profile?.key === 's3') {
    return 'Select Development, Testing, or Production.';
  }
  return 'Choose Development or Test. This product does not accept Production.';
}

module.exports = {
  PROFILES,
  profileFor,
  catalogEnvironment,
  environmentError,
};
