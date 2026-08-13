# 前提

- Node.js

動画ではv24.15.0

- AWS CLI

https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.html

下記コマンドで認証情報が返ってくればOK

```
aws sts get-caller-identity
```

または

```
aws sts get-caller-identity --profile プロファイル名
```

- AWS CDK CLI

CDK CLIはNode.js製のCLIなのでNode.jsがインストールされてることが前提

https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/cli.html

# ハンズオン手順

1. 初期コードを準備
1. ディレクトリ構造を確認
1. Lambdaを作成（関数のコードはインラインで埋め込み）
1. APIGatewayを作成・Lambdaと紐付け
1. Lambdaを更新①（外部JSファイル）
1. Lambdaを更新②（TS * Node.jsライブラリ）

# 初期コードを準備

## 方針

このリポジトリのコードをDL（TSを含めて関連モジュールのバージョンを固定したいため）

## 本来なら...

下記コマンドでプロジェクトを作成

```
mkdir cdk-handson
cd cdk-handson
cdk init app --language typescript
```

# ディレクトリ構造を確認

## lib

- コンストラクト = AWSリソースを作るクラス
- Lambda・APIGWなど作りたい各AWSリソース（コンストラクト）の定義場所
- 上記リソース（コンストラクト）をまとめたスタックの定義場所でもある
- ここで定義したスタックは`export`して`bin`でインスタンス化する

## bin

- binはスタックをインスタンス化する場所
- インスタンス化 → そのStackから作られるAWSリソース全体を表すJavaScriptオブジェクト
- 上記オブジェクトが実際のCFテンプレートに変換される（`cdk synth`）

# Lambdaを作成

## Lambdaを作成（関数のコードはインラインで埋め込み）

- Lambda関数を作るクラス（コンストラクト）や関連する定数・メソッドの読み込み

```ts
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
```

- Lambda関数の定義

公式リファレンス：[Lambdaクラス](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda-readme.html)、[APIGateway（HTTP API）クラス](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigatewayv2-readme.html)


```ts
    // OmikujiFunction は CloudFormation の 論理ID の元になる
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
```

## 初めてCDKでデプロイする際の設定

cdkでAWSへデプロイするための初期設定を行うコマンド。デプロイ時に利用するIAMロールやS3バケットなどが作成されます。

- 現在利用しているAWSプロファイルを対象に実行

```
cdk bootstrap
```

- アカウントとリージョンを明示的に指定

```
cdk bootstrap --profile プロファイル名 --region リージョン
```

## LambdaをCDKでデプロイ

- CFnテンプレート作成 

```
cdk synth
```

- CFnテンプレート作成 + デプロイ

```
cdk deploy
```

または

```
cdk deploy --profile プロファイル名
```

## 公式リファレンス

- [Lambdaクラス](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda-readme.html)
- [APIGateway（HTTP API）クラス](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigatewayv2-readme.html)


# APIGatewayを作成・Lambdaと紐付け

1. APIGateway（HTTP）を作成するクラス（コンストラクト）など読み込み
1. APIGatewayとLambdaの統合作成
1. APIルートと統合の紐付け

「1. APIGateway（HTTP）を作成するクラス（コンストラクト）など読み込み」

```ts
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
```

「2. APIGatewayとLambdaの統合作成」と「3. APIルートと統合の紐付け」

```ts
    const api = new HttpApi(this, "OmikujiHttpApi");

    const integration = new HttpLambdaIntegration('OmikujiFunctionIntegration', func);

    api.addRoutes({
      path: '/omikuji',
      methods: [HttpMethod.GET],
      integration
    });
```

# Lambdaを更新①（外部JSファイル）

- lambda/index.mjs

```js
export const handler = async (event) => {
  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!!!!!!!!!!'),
  };
  return response;
};
```

- cdk-handson-stack.ts

```ts
    const func = new Function(this, 'OmikujiFunction', {
      runtime: Runtime.NODEJS_24_X,
      handler: "index.handler", // ファイル名 + ハンドラー名
      code: Code.fromAsset("lambda"), // ディレクトリ名
    });
```

# Lambdaを更新②（TS * Node.jsライブラリ）

- lambda/index.ts

Node.jsライブラリを使った”おみくじ”関数を作成

```ts
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2
} from 'aws-lambda';

import random from 'random';

const FORTUNES = [
  '大吉',
  '中吉',
  '小吉',
  '吉',
  '末吉',
] as const;

export const handler = async function (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> {

  // 配列からランダムで選ぶ
  const fortune = random.choice([...FORTUNES])!;

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      fortune,
    }),
  };
};
```

- Lambdaの型をインストール

```
npm i @types/aws-lambda -D 
```

- ライブラリインストール

[色んなランダムの値を作るライブラリ](https://www.npmjs.com/package/random)

```
npm i random
```

- lib/cdk-handson-stack.ts

TSのコンパイルが必要になる。そのためにはLambdaを作るクラスを変更する必要

```ts
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'node:path';
```

上記クラスを使ったLambdaの定義

```ts
    const func = new NodejsFunction(this, 'OmikujiFunction', {
      runtime: Runtime.NODEJS_24_X,
      handler: "index.handler",
      entry: path.join(__dirname, '../lambda/index.ts'),
    });
```

コンストラクトはAWSリソースを作るクラスとは限らない

```ts
    // APIGWのURLを出力したい
    new cdk.CfnOutput(this, 'HttpApiOmikujiUrl', {
      value: `${api.apiEndpoint}/omikuji`
    });
```

# 完成コード

```ts
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'node:path';
import { Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { HttpApi, HttpMethod, CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class CdkHandsonStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const func = new NodejsFunction(this, 'OmikujiFunction', {
      runtime: Runtime.NODEJS_24_X,
      handler: "index.handler",
      entry: path.join(__dirname, '../lambda/index.ts'),
    });

    const api = new HttpApi(this, "OmikujiHttpApi");

    // ↓ CORS許可設定などしたい場合
    // const api = new HttpApi(this, "HelloHttpApi", {
    //   corsPreflight: {
    //     allowHeaders: ['content-type'],
    //     allowMethods: [
    //       CorsHttpMethod.GET,CorsHttpMethod.OPTIONS,
    //     ],
    //     allowOrigins: ['*'],
    //   }
    // });

    const integration = new HttpLambdaIntegration('OmikujiFunctionIntegration', func);

    api.addRoutes({
      path: '/omikuji',
      methods: [HttpMethod.GET],
      integration
    });

    // APIGWのURLを出力したい
    new cdk.CfnOutput(this, 'HttpApiOmikujiUrl', {
      value: `${api.apiEndpoint}/omikuji`
    });

  }
}
```

# 付録

## テストを書く

- test-handson.test.ts

```ts
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
```

- lambda.test.ts

```ts
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

const { handler } = require('../lambda/index.ts') as typeof import('../lambda/index');

describe('おみくじLambda', () => {
  test('許可されたおみくじ結果をJSONで返す', async () => {
    const response = await handler({} as APIGatewayProxyEventV2);

    expect(response).toEqual(expect.objectContaining({
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }));

    expect(response.body).toBeDefined();
    const body = JSON.parse(response.body!);

    expect(body).toEqual({
      fortune: expect.stringMatching(/^(大吉|中吉|小吉|吉|末吉)$/),
    });
  });
});
```

- テスト実行

```
npm run test -- --verbose
```

## Lambdaをローカル実行する

- [AWS SAM CLI](https://docs.aws.amazon.com/ja_jp/serverless-application-model/latest/developerguide/install-sam-cli.html) と Dockerをインストールしてることが前提
- `cdk synth`でCFテンプレート作成
- 下記コマンドで実行

Lambdaのみ

```
sam local invoke \
  -t cdk.out/CdkHandsonStack.template.json \
  OmikujiFunction
```

APIGW + Lambda

```
sam local start-api \
  -t cdk.out/CdkHandsonStack.template.json \
  --host 127.0.0.1 \
  --port 3000
```
