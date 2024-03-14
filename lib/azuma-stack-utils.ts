/* Copyright (c) 2022 NetWitness or its affiliates. All rights reserved. */

import {Construct} from "constructs";
import * as filesystem from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import {logger} from "./azuma-types";
import {ParameterTier, StringParameter} from "aws-cdk-lib/aws-ssm";
import {Code, LayerVersion, Runtime} from "aws-cdk-lib/aws-lambda";
import {GetCallerIdentityCommand, STSClient} from "@aws-sdk/client-sts";
import * as fs from "fs";
import {CfnTag} from "aws-cdk-lib";

export class AzumaStackUtils {
    /**
     * Load deployment-config.json and fetch environment attributes. The deployment-config.json
     * specifies a set of values for each environment like prod, test, stage, local, development etc.
     * The environment can be set via DEPLOYMENT_TYPE environment variable set into the shell.
     *
     * @param directory directory path that contains `deployment-config.json`
     * @returns  Promise<DeploymentConfig> environment configuration
     */
     static getDeploymentConfig(directory:string, stage:string): {[key:string]: {[key:string]: string}} {

        // Construct file path
        const filePath = path.join(directory, 'deploy-config.json');

        // Does the file exists in the path
        if (! filesystem.existsSync(filePath)) {
            logger.error(`Deployment configuration file not found !, was expecting file: ${filePath} `);

            // Cant proceed without an enviroment set
            throw new Error(`Deployment config missing, unable to find file:  ${filePath}`);
        }

        // Load the file, this is a JSON file that contains attributes for each of the environment
        const environments = JSON.parse(filesystem.readFileSync(filePath, 'utf-8').toString());
        const env = environments[stage];

        if (! env) {
            logger.error(`Deployment configuration for stage ${stage} not Found ! in file: ${filePath}`);

            // Cant proceed, none of the configuration matched for specified environment
            throw new Error(`Deployment configuration not found at ${filePath} for Stage: ${stage}`);
        }
        return env;
    }

    /**
     * Apply tags to the stack
     */
    static applyTags = (app: Construct, tags:{[key:string]: string}) => {
        for (const [tag, value] of new Map(Object.entries(tags)))  {
            cdk.Tags.of(app).add(tag, value);
        }
    }

    /**
     * Convert a dictionary to CfnTag []
     *
     * @param tags Tags to convert to CfnTag structure
     * @returns CfnTag array or undefined incsse the parameters is undefined/empty
     */
    static toCfnTags = (tags:{[key:string]: string}): CfnTag[] => {
        const cfnTtags: CfnTag [] = [];
        for (const [tag, v] of new Map(Object.entries(tags))) { cfnTtags.push({key: tag, value: v} as CfnTag)}
        return cfnTtags;
    }


    /**
     * Add a SSM string parameter
     *
     * @param scope Construct
     * @param id Id of the SSM parameter
     * @param parameterName Name of the parameter i.e. key
     * @param description A meaningful Description
     * @param allowedPattern Pattern to apply
     * @param value Value of the parameter key
     */
    static setSsmStringParameter(
        scope: Construct, id: string, parameterName: string, description: string,  value: string) {

        new StringParameter(scope, id, {
            parameterName: parameterName,
            description: description,
            allowedPattern: '.*',
            stringValue: value,
            tier: ParameterTier.STANDARD
        });
    }


    /**
     * Create dependency layer for lambda
     *
     * @param scope Stack scope
     * @param layerName Name of the layer
     * @param namespace Namespace to separate layer
     * @returns LayerVersion instance
     */
    static dependenciesLayer (scope: Construct, layerName: string, namespace: string): LayerVersion {
        return new LayerVersion(scope, 'dependenices-layer', {
          code: Code.fromAsset('layer/'),
          compatibleRuntimes: [Runtime.NODEJS_20_X],
          description: `AZM ${layerName} layer dependencies`,
          layerVersionName: `${namespace}-dependenices-layer`
        });
    }

    // get namespace from aws default profile
    static async getUserNamespace(): Promise<string | undefined> {
        try {
            // eslint-disable-next-line max-len
            // Sample arn="arn:aws:sts::676121293094:assumed-role/AWSResexxxxxx/Ratheesh.Nair@azumarealty.com"
            const arn:string | undefined = (await new STSClient({}).send(new GetCallerIdentityCommand({}))).UserId;

            if (! arn) {
                return undefined;
            }

            // Attempt to find the username from the ARN
            const namespace = arn
                    .substring(arn.lastIndexOf('/') + 1, arn.lastIndexOf('@'))
                    .replace(/[^\w\s\r\n]/gi, '-').substring(0, 10).replace(/-+$/, '');

            console.debug('User config namespace', namespace);
            return namespace;
        } catch (err) {
            console.debug('Errored while getting the aws user', err);
        }
        return undefined;
  }

  static async getNamespace(): Promise<string> {

    // Attempt to get the NAMESPACE from environment variables, this will override current AWS profile
    const namespaceFromEnv = process.env.NAMESPACE;
    const namespace = namespaceFromEnv ? namespaceFromEnv : await AzumaStackUtils.getUserNamespace();

    if (! namespace || namespace === "undefined") {
      throw new Error('Unable to determine AWS user. Your environment is not configured with AWS account profiles');
    }
    return namespace;
  }


  /**
   * List all the files in the specified folder path and its children
   *
   * @param folder Folder to list contents
   * @param recursive Whether to go recursive
   * @returns List of files in specified path and files in sub-folders if recursive is true
   */
  static lsdir = (folder: string, recursive = false): string[] => {

    let results: string[] = [];
    folder = path.resolve(folder);
    const entries = fs.readdirSync(folder);

    entries.forEach(entry => {

        results.push(`${folder}/${entry}`);
        const stat = fs.lstatSync(`${folder}/${entry}`);

        // Is recursive on ?
        if (stat && stat.isDirectory() && recursive) {

            // Yes, look at the entries in sub dir
            console.log(`Entry ${folder}/${entry} is a directory, retrieve children `);
            results = results.concat(this.lsdir(`${folder}/${entry}`, true));
        }
    });
    return results;
  }
}
