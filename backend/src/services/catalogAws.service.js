const {
  DescribeProductCommand,
  DescribeProvisionedProductCommand,
  DescribeProvisioningParametersCommand,
  ListLaunchPathsCommand,
  ProvisionProductCommand,
  SearchProductsCommand,
} = require('@aws-sdk/client-service-catalog');
const crypto = require('crypto');
const { awsError, catalogClient } = require('../config/aws');
const { catalogEnvironment, environmentError, profileFor } = require('./productProfiles');

const FORM_VALUES = {
  instancetype: 'instanceType',
  environment: 'environment',
  subnet: 'subnet',
  subnetid: 'subnet',
  vpc: 'vpc',
  vpcid: 'vpc',
  region: 'region',
};

function toCatalogProduct(summary, artifact) {
  return {
    id: summary.ProductId,
    name: summary.Name,
    version: artifact?.Name || 'v1',
    category: 'Compute',
    status: 'Approved',
    description: summary.ShortDescription || summary.Name,
    provider: summary.Owner || 'AWS Service Catalog',
    infrastructure: {
      ec2Instance: 'Defined in the Service Catalog CloudFormation template',
      securityGroup: 'Defined in the Service Catalog CloudFormation template',
      cloudFormationTemplate: artifact?.Name || 'CloudFormation',
      environment: 'Development',
    },
  };
}

async function launchTarget(productId) {
  const client = catalogClient();
  const described = await client.send(new DescribeProductCommand({ Id: productId }));
  const summary = described.ProductViewSummary;
  if (!summary) {
    return null;
  }

  const artifacts = described.ProvisioningArtifacts || [];
  const artifact = artifacts.find((item) => item.Guidance === 'DEFAULT') || artifacts[0];
  const paths = await client.send(new ListLaunchPathsCommand({ ProductId: productId }));
  const path = (paths.LaunchPathSummaries || [])[0];

  return {
    summary,
    artifact,
    pathId: path?.Id,
    product: toCatalogProduct(summary, artifact),
  };
}

async function listProducts() {
  try {
    const result = await catalogClient().send(new SearchProductsCommand({ PageSize: 20 }));
    const views = result.ProductViewSummaries || [];
    const products = [];
    for (const view of views) {
      const target = await launchTarget(view.ProductId);
      if (target) {
        products.push(target.product);
      }
    }
    return products;
  } catch (error) {
    throw awsError(error);
  }
}

async function getProduct(productId) {
  try {
    const target = await launchTarget(productId);
    return target?.product || null;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return null;
    }
    throw awsError(error);
  }
}

async function provisioningParameters(productId, artifactId, pathId, input, profile) {
  const described = await catalogClient().send(
    new DescribeProvisioningParametersCommand({
      ProductId: productId,
      ProvisioningArtifactId: artifactId,
      PathId: pathId,
    }),
  );

  return (described.ProvisioningArtifactParameters || []).flatMap((parameter) => {
    const field = FORM_VALUES[String(parameter.ParameterKey || '').toLowerCase()];
    let value = field ? String(input[field] || '').trim() : '';
    if (parameter.ParameterKey === 'Environment') {
      value = catalogEnvironment(profile, input.environment);
      if (!value) {
        const error = new Error(environmentError(profile));
        error.status = 400;
        throw error;
      }
    }
    const allowed = parameter.ParameterConstraints?.AllowedValues?.filter(Boolean) || [];
    if (value && allowed.length > 0 && !allowed.includes(value)) {
      const error = new Error(`${parameter.ParameterKey} must be one of: ${allowed.join(', ')}.`);
      error.status = 400;
      throw error;
    }
    if (!value) {
      if (parameter.DefaultValue) {
        return [];
      }
      if (parameter.IsNoEcho) {
        return [];
      }
      const error = new Error(`CloudFormation parameter ${parameter.ParameterKey} is required.`);
      error.status = 400;
      throw error;
    }
    return [{ Key: parameter.ParameterKey, Value: value }];
  });
}

async function provisionProduct(productId, provisionedProductName, input) {
  try {
    const target = await launchTarget(productId);
    if (!target?.artifact?.Id || !target.pathId) {
      const error = new Error('This product has no active version or launch path.');
      error.status = 400;
      throw error;
    }

    const profile = profileFor({ id: productId, name: target.summary?.Name });
    let parameters = [];
    try {
      parameters = await provisioningParameters(
        productId,
        target.artifact.Id,
        target.pathId,
        input,
        profile,
      );
    } catch (error) {
      if (error.status === 400) {
        throw error;
      }
      const wrapped = new Error(
        'Service Catalog could not read the product parameters. Confirm the product has a launch constraint that uses ServiceCatalogLaunchRole.',
      );
      wrapped.status = 502;
      throw wrapped;
    }

    const result = await catalogClient().send(
      new ProvisionProductCommand({
        ProductId: productId,
        ProvisioningArtifactId: target.artifact.Id,
        PathId: target.pathId,
        ProvisionedProductName: provisionedProductName,
        ProvisioningParameters: parameters,
        ProvisionToken: crypto.randomUUID(),
      }),
    );

    return result.RecordDetail || {};
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw awsError(error);
  }
}

function mapProvisionedStatus(status) {
  if (status === 'AVAILABLE') {
    return 'AVAILABLE';
  }
  if (status === 'ERROR' || status === 'TAINTED') {
    return 'FAILED';
  }
  return 'PROVISIONING';
}

async function provisionedStatus(provisionedProductId) {
  try {
    const result = await catalogClient().send(
      new DescribeProvisionedProductCommand({ Id: provisionedProductId }),
    );
    const detail = result.ProvisionedProductDetail || {};
    return {
      status: mapProvisionedStatus(detail.Status),
      message: detail.StatusMessage || 'Provisioning requested through AWS Service Catalog.',
    };
  } catch (error) {
    throw awsError(error);
  }
}

module.exports = {
  listProducts,
  getProduct,
  provisionProduct,
  provisionedStatus,
};
