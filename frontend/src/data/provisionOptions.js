export const EC2_PRODUCT_ID = 'prod-jrgcrbhgoxw24';
export const S3_PRODUCT_ID = 'prod-ctdwlxj3ybi5g';

export const REGION_CODE = 'eu-north-1';
export const REGION_LABEL = 'Europe (Stockholm)';

export const PRODUCT_PROFILES = {
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

export const INITIAL_PROVISION_FORM = {
  environment: 'Development',
  instanceType: 't3.micro',
  region: REGION_CODE,
  subnet: '',
  vpc: '',
};

export function productProfile(product) {
  const id = String(product?.id || '');
  const name = String(product?.name || '').trim().toLowerCase();
  if (id === PRODUCT_PROFILES.ec2.id || name === 'development ec2') {
    return PRODUCT_PROFILES.ec2;
  }
  if (id === PRODUCT_PROFILES.s3.id || name === 's3 storage') {
    return PRODUCT_PROFILES.s3;
  }
  return null;
}
