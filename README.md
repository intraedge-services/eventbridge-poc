# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## Login to AWS

* AWS_PROFILE=intraedge-training
* aws sso login --profile $AWS_PROFILE

## Deploy the CDK Stack
* cdk deploy --profile intraedge-training

## Generate event eventcatalog
AWS_PROFILE=intraedge-training npm run generate
npm run dev
