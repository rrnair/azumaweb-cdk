
import { StackProps } from "aws-cdk-lib";
import { Role } from "aws-cdk-lib/aws-iam";
import { LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { createLogger, format, transports } from "winston";

// Construct winston logger for cdk module. Lambda and application logs should be implemented
// using `lambda-log` library
const logger = createLogger({
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({timestamp, level, message}) => {
            return `[${timestamp}] ${level}: ${message}`;
        })
    ),
    transports: [
        new transports.File({
            dirname: 'logs',
            filename: 'cdk.log'
        }),
        new transports.Console()
    ],
    defaultMeta: {service: 'azuma-realty-web-cdk'}
});

// Export logger
export {logger};


/**
 * Base properties for NWS Telemetry Stack, implement this for each construct as required
 *
 * All stacks and its constructs should put their resources as `${namespace}-${workspace}-[resource-id]`.
 *
 */
export interface AzumaStackProps extends StackProps {

    // Mandatory namespace is prepended to the stack
    namespace: string,

    // Service - used in SSM parameter key
    service: string,
 
    // Tenant to which we are deploying this stack
    tenantId?: string,
 
    // A short hand for concatenated namespace, workspace and tenantId
    prefix: string,
 
    ssmParamPrefix: string
 
    // Environment where we are deploying
    env: {
        // Which AWS account
        account: string,

        // Which AWS region
        region: string
    },

    // Various deployment stages - dev, test, prod etc
    stage: string,

    // A list of Tags and other attributes to attach to a deployment
    deploymentConfig: {[key:string]: {[key:string]: string}},
 
    
    // Default memory size for lambda
    lambdaMemorySize: number,
 
    // Lambda runtime
    lambdaRuntime: Runtime,
 
    
    // Environment variables - typically used for setting env variables for Lambda
    serviceEnvironment: {[key: string]: string},
 
    // Lambda Layer version
    layers?: LayerVersion[],
 
    // Name of the telemetry bucket
    websiteBucketName: string
 
    // Any service role to set for lambda, for instance a lambda may set role to have write access to AWS opensearch
    lambdaServiceRole?: Role,
 
    // Default Timeout for all Lambdas, override this in individual lambdas
    lambdaTimeoutInMins?: number,
 
    logRetention: {
         lambdas: RetentionDays
    }
 
    // Permission Boundary
    permissionBoundary?: string
}


/**
 * Properties of S3 bucket that will hold telemetry payloads
 */
export interface NwsTmBucketProps {

    // Id of the bucket
    id: string,

    // Name of the bucket
    name: string,

    // Optional flag to enable/disable versioning.
    versioned?: boolean

}