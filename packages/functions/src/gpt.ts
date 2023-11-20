import AWS from "aws-sdk";
import * as uuid from "uuid";
import { gptModel } from "../model/gpt.model"
import { Config } from "sst/node/config";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import fetch from "node-fetch";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const {
    messages,
    provider,
    metadata
  } = JSON.parse(event.body!);
  
  const gptRequest = {
    model: "gpt-3.5-turbo",
    messages
  }

  try {
    const gptResponse = await fetch(Config.GPT_URL, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Config.GPT_TOKEN}`
      },
      body: JSON.stringify(gptRequest)
    })

    const gptJsonResponse: gptModel= await gptResponse.json() as gptModel
    if (!gptResponse.ok || gptJsonResponse.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "error",
          error: gptJsonResponse.error.message
        }),
      };
    }

    const params = {
      TableName: `${process.env.SST_Table_tableName_Events}`,
      Item: {
        id: uuid.v1(),
        provider: provider,
        metaData: metadata,
        log: {
          event: "conversation",
          value: [...messages, gptJsonResponse.choices[0].message],
          timestamp: new Date().toISOString()
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
    };
    await dynamoDb.put(params).promise();
  
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "success",
        choices: gptJsonResponse.choices
      }),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 400,
      body: JSON.stringify({message: error}),
    };
  }
};