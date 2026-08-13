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