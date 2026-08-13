import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';

import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class CdkHandsonStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const func = new Function(this, 'OmikujiFunction', {
      runtime: Runtime.NODEJS_24_X,
      handler: 'index.handler',
      code: Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            body: 'Hello from Lambda!'
          };
        };
        `)
    });
    
    const api = new HttpApi(this, "OmikujiHttpApi");

    const integration = new HttpLambdaIntegration('OmikujiFunctionIntegration', func);

    api.addRoutes({
      path: '/omikuji',
      methods: [HttpMethod.GET],
      integration
    });

  }
}
