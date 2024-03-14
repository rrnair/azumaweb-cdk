import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AzumawebStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket for hosting static website
    
    // Create API Gateway for submitting enquiries

    // Create Lambda for processing enquiries and triggering emails

    // Create SES for sending emails

    // Create cloudfront distribution 
    
    // Set S3 as origin

    // Set API Gateway as origin
  }
}
