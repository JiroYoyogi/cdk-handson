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

# 初期状態コードの準備

## 方針

このリポジトリのコードをDL（TSを含めて関連モジュールのバージョンを固定したいため）

## 本来なら...

下記コマンドでプロジェクトを作成

```
mkdir cdk-handson
cd cdk-handson
cdk init app --language typescript
```

# CDKからCloudFormationテンプレートを作るイメージ

## どのようにコードを書いていくか

- 各AWSリソースのクラス（S3、Lambda、API Gatewayなど）が用意されている
- クラスをインスタンスにする際に設定を渡す
- 同じスタックに定義したリソース（インスタンス）は、同じCFンプレートとして管理される

※イメージ

## どのようにデプロイされるのか

1. TypeScript（各言語）でAWSリソースを定義
2. `cdk synth` でTSを実行 → CloudFormationテンプレート
3. `cdk deploy` で 2 のテンプレートを元にデプロイ（`deploy`は`synth`も実行）

※イメージ

## その他

- 1つのCDKプロジェクトでCFスタックを作ることも可能

# binとlib

## bin

- binはスタックをインスタンス化する場所
- インスタンス化 → そのStackから作られるAWSリソース全体を表すJavaScriptオブジェクト
- 上記オブジェクトが実際のCFテンプレートに変換される（`cdk synth`）

※ざっくりイメージ

## lib

- コンストラクト = AWSリソースを作るクラス
- Lambda・APIGWなど作りたい各AWSリソース（コンストラクト）の定義場所
- 上記リソース（コンストラクト）をまとめたスタックの定義場所でもある
- ここで定義したスタックは`export`して`bin`でインスタンス化する


# Lambdaを作成

- インラインで作る
- コードを読み込む
- デプロイしてみる

# API Gatewayを作成

# LambdaをTSで書く・ライブラリを使う

# その他

## Lambdaをローカル実行する

## テストを書く

- 書いちゃってよいかも。実行だけして貰う

## L1 ? L2 ? L3 ?

- 気にしないが吉。実装で気にすることは無い
- AWSリソースを作るクラスにはLambdaを作るもの、API Gateway + Lambdaをまとめて作るものなど存在
- 関連リソースをどのぐらいまとめて作るかのレベル分け（抽象化のレベル）