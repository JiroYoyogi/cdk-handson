## CloudFormationテンプレート

※イメージ

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: HTTP API that invokes Lambda on GET /Omikuji

Resources:
  # Lambdaの実行ロール
  OmikujiFunctionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - lambda.amazonaws.com
            Action:
              - sts:AssumeRole
  # Lambda関数
  OmikujiFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: Omikuji-function
      Runtime: nodejs24.x
      Handler: index.handler
      Role: !GetAtt OmikujiFunctionRole.Arn
  # API Gateway HTTP API
  OmikujiApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: Omikuji-api
      ProtocolType: HTTP
  # API GatewayとLambdaの連携設定
  OmikujiIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref OmikujiApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !GetAtt OmikujiFunction.Arn
      PayloadFormatVersion: "2.0"
  # GET /Omikuji
  OmikujiRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref OmikujiApi
      RouteKey: "GET /Omikuji"
      AuthorizationType: NONE
      Target: !Sub integrations/${OmikujiIntegration}
  # $defaultステージ
  OmikujiStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref OmikujiApi
      StageName: "$default"
      AutoDeploy: true
  # API GatewayからLambdaを呼び出す権限
  OmikujiFunctionPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref OmikujiFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub
        - arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiId}/*/GET/Omikuji
        - ApiId: !Ref OmikujiApi
```

## CDK

- スタック（Stack）= CloudFormationのスタックを表すクラス
- Stackクラスを書いてインスタンス化すると、そのインスタンスがCFテンプレートに変換される

```js
export class OmikujiStack {

  constructor() {

    // Lambda関数を作成するクラス（コンストラクタ）
    const func = new Function(this, "Function", {
      runtime: Runtime.NODEJS_24_X,
      handler: "app.handler",
      ~ 略 ~
    });

    // API Gateway（HTTP API）を作成するクラス（コンストラクタ）
    const api = new HttpApi(this, "Api");

    // APIGW と Lambda の 統合 を作成するクラス（コンストラクタ）
    const integration = new HttpLambdaIntegration('Integration', func);
    api.addRoutes({ path: '/omikuji', methods: ["GET"], integration });
    
  }
}
```
