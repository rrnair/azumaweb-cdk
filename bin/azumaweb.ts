#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AzumawebStack } from '../lib/azumaweb-stack';
import { AzumaStackUtils } from '../lib/azuma-stack-utils';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { AzumaStackProps, logger } from '../lib/azuma-types';
import { exit } from 'process';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';


const namespace = process.env.NAMESPACE || 'AZM';

const stage = process.env.STAGE || 'dev';

const account = process.env.CDK_DEFAULT_ACCOUNT;

const region = process.env.CDK_DEFAULT_REGION;

// Grab deploymnet configuration
const config:{[key:string]: {[key:string]: string}} = AzumaStackUtils.getDeploymentConfig(__dirname, stage);

const {tags, domain: {hostedZoneName, hostedZoneId, hostedDomain, domainCertificateID}} = config;

// Default tenant id, Telemetry will have only one tenant. A tenant here is very similar to Workspace so that a
// developer can deploy his/her stack along side others
const tenantId:string  = process.env.TENANT || 'local';

const lambdaRuntime = Runtime.NODEJS_20_X;

const service = 'azuma-web';

if (! account) {
  logger.error('AWS Account is not configured!, please configure AWS Account');
  exit(100);
}

if (! region) {
  logger.error('AWS Region is not configured!, please configure AWS Region');
  exit(200);
}


if (! tenantId) {
  logger.error('Tenant environment variable is not set!, please set `TENANT=<value>` environment variable.');
  exit(300);
}


const prefix = `${namespace}-${tenantId}-${stage}-${region}`;

logger.info(
  `Using AWS Account: ${account}, Region ${region}, Namespace: ${namespace}, `
    + `Service: ${config}, Stage: ${stage}, Tenant: ${tenantId} ...`);

const stackProps:AzumaStackProps = {
  namespace: namespace,
  tenantId: tenantId,
  prefix: prefix,
  description: 'Azuma Website stack',
  service: service,
  lambdaMemorySize: 1024,
  stage: stage,
  deploymentConfig: config,
  lambdaRuntime: lambdaRuntime,
  websiteBucketName: `${prefix}-azuma.co.in`.toLowerCase(),
  ssmParamPrefix: `/${namespace}/${tenantId}/${stage}/`,
  serviceEnvironment: {
    ['NAMESPACE']: namespace,
    ['SERVICE']: service,
    ['STAGE']: stage,
    ['REGION']: region,
    ['TENANT']: tenantId
  },
  logRetention: {
    lambdas: RetentionDays.ONE_DAY
  },
  env: {
    account: account,
    region: region
  }
};

const app = new cdk.App();
new AzumawebStack(app, 'AzumawebStack', stackProps);