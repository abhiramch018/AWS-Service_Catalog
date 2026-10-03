const {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} = require('@aws-sdk/client-ec2');
const { portalMode } = require('../config/aws');

const DEMO_VPCS = [
  { id: 'vpc-demo-main', label: 'Development VPC (vpc-demo-main)' },
];

const DEMO_SUBNETS = [
  {
    id: 'subnet-demo-a',
    vpcId: 'vpc-demo-main',
    label: 'Subnet A - eu-north-1a (subnet-demo-a)',
  },
  {
    id: 'subnet-demo-b',
    vpcId: 'vpc-demo-main',
    label: 'Subnet B - eu-north-1b (subnet-demo-b)',
  },
];

function projectRegion() {
  return process.env.AWS_REGION || 'eu-north-1';
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertVpcId(vpcId) {
  const value = String(vpcId || '');
  const pattern = portalMode() === 'aws' ? /^vpc-[0-9a-f]+$/i : /^vpc-[a-z0-9-]+$/i;
  if (!pattern.test(value)) {
    throw httpError('A valid VPC is required.', 400);
  }
}

function nameTag(tags = []) {
  return tags.find((tag) => tag.Key === 'Name')?.Value?.trim() || '';
}

function ec2Client() {
  const region = projectRegion();
  if (!process.env.AWS_REGION) {
    throw httpError('AWS_REGION must be set.', 500);
  }
  return new EC2Client({ region });
}

async function describeAll(client, commandFactory) {
  const records = [];
  let nextToken;
  do {
    const page = await client.send(commandFactory(nextToken));
    records.push(...(page.Vpcs || page.Subnets || []));
    nextToken = page.NextToken;
  } while (nextToken);
  return records;
}

async function listVpcs() {
  if (portalMode() !== 'aws') {
    return { region: projectRegion(), vpcs: DEMO_VPCS };
  }

  try {
    const client = ec2Client();
    const vpcs = await describeAll(client, (nextToken) => new DescribeVpcsCommand({ NextToken: nextToken }));
    return {
      region: projectRegion(),
      vpcs: vpcs
        .map((vpc) => {
          const name = nameTag(vpc.Tags);
          return {
            id: vpc.VpcId,
            label: `${name || 'VPC'} (${vpc.VpcId})`,
          };
        })
        .sort((left, right) => left.label.localeCompare(right.label)),
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    if (error.name === 'UnauthorizedOperation') {
      throw httpError('The backend cannot list VPCs. Allow ec2:DescribeVpcs.', 502);
    }
    throw httpError(error.message || 'VPCs could not be loaded.', 502);
  }
}

async function listSubnets(vpcId) {
  assertVpcId(vpcId);

  if (portalMode() !== 'aws') {
    if (!DEMO_VPCS.some((vpc) => vpc.id === vpcId)) {
      throw httpError('VPC not found.', 404);
    }
    return {
      vpcId,
      subnets: DEMO_SUBNETS.filter((subnet) => subnet.vpcId === vpcId),
    };
  }

  try {
    const client = ec2Client();
    const vpcs = await client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    if (!vpcs.Vpcs?.length) {
      throw httpError('VPC not found.', 404);
    }

    const records = await describeAll(
      client,
      (nextToken) =>
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          NextToken: nextToken,
        }),
    );

    return {
      vpcId,
      subnets: records
        .map((subnet) => {
          const name = nameTag(subnet.Tags);
          return {
            id: subnet.SubnetId,
            label: `${name || 'Subnet'} - ${subnet.AvailabilityZone} (${subnet.SubnetId})`,
          };
        })
        .sort((left, right) => left.label.localeCompare(right.label)),
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    if (error.name === 'InvalidVpcID.NotFound') {
      throw httpError('VPC not found.', 404);
    }
    if (error.name === 'UnauthorizedOperation') {
      throw httpError('The backend cannot list subnets. Allow ec2:DescribeSubnets.', 502);
    }
    throw httpError(error.message || 'Subnets could not be loaded.', 502);
  }
}

async function assertSelection({ region, vpc, subnet }) {
  if (region !== projectRegion()) {
    throw httpError(`Region must be ${projectRegion()}.`, 400);
  }

  const result = await listSubnets(vpc);
  if (!result.subnets.some((item) => item.id === subnet)) {
    throw httpError('The selected subnet does not belong to the selected VPC.', 400);
  }
}

module.exports = { listVpcs, listSubnets, assertSelection, projectRegion };
