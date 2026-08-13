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


## APIGatewayを作成・Lambdaと紐付け

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

## Lambdaを作成（関数のコードは外部JSファイル）

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

## Lambdaを作成（TS * Node.jsライブラリ）

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

# その他

## 1つのCDKプロジェクトで複数CFスタックを作る

```ts
import * as cdk from "aws-cdk-lib";
import { TodoStack } from "../lib/todo-stack";

const app = new cdk.App();

// 開発環境
new TodoStack(app, "TodoDevStack", {
  envName: "dev",
});

// 本番環境
new TodoStack(app, "TodoProdStack", {
  envName: "prod",
});
```

開発環境だけデプロイ

```
cdk deploy TodoDevStack
```

本番環境だけデプロイ

```
cdk deploy TodoProdStack
```

どちらもデプロイ

```
cdk deploy --all
```

## テストを書く

ザクっと実装してるので下記で実行

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

## L1 ? L2 ? L3 ?

- 気にしないが吉。実装で気にすることは無い
- AWSリソースを作るクラスにはLambdaを作るもの、API Gateway + Lambdaをまとめて作るものなど存在
- 関連リソースをどのぐらいまとめて作るかのレベル分け（抽象化のレベル）