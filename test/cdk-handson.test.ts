import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { CdkHandsonStack } from '../lib/cdk-handson-stack';

describe('CdkHandsonStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new CdkHandsonStack(app, 'MyTestStack');
    template = Template.fromStack(stack);
  });

  test('Node.js 24のLambda関数を作成する', () => {
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs24.x',
      Handler: 'index.handler',
    });
  });

  test('HTTP APIを作成する', () => {
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      ProtocolType: 'HTTP',
    });
  });

  test('GET /omikujiルートをLambda統合に接続する', () => {
    template.resourceCountIs('AWS::ApiGatewayV2::Integration', 1);
    template.hasResourceProperties('AWS::ApiGatewayV2::Integration', {
      IntegrationType: 'AWS_PROXY',
      IntegrationUri: {
        'Fn::GetAtt': [Match.stringLikeRegexp('OmikujiFunction'), 'Arn'],
      },
      PayloadFormatVersion: '2.0',
    });

    template.resourceCountIs('AWS::ApiGatewayV2::Route', 1);
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'GET /omikuji',
      Target: Match.objectLike({
        'Fn::Join': Match.arrayWith([
          Match.arrayWith([
            Match.objectLike({
              Ref: Match.stringLikeRegexp('OmikujiFunctionIntegration'),
            }),
          ]),
        ]),
      }),
    });
  });

  test('API GatewayにLambdaを呼び出す権限を付与する', () => {
    template.resourceCountIs('AWS::Lambda::Permission', 1);
    template.hasResourceProperties('AWS::Lambda::Permission', {
      Action: 'lambda:InvokeFunction',
      Principal: 'apigateway.amazonaws.com',
      FunctionName: {
        'Fn::GetAtt': [Match.stringLikeRegexp('OmikujiFunction'), 'Arn'],
      },
    });
  });

  test('末尾が/omikujiのAPI URLを出力する', () => {
    template.hasOutput('HttpApiOmikujiUrl', {
      Value: {
        'Fn::Join': Match.arrayWith([
          Match.arrayWith(['/omikuji']),
        ]),
      },
    });
  });
});
