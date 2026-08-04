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
