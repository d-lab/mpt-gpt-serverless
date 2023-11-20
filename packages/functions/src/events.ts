import AWS from "aws-sdk";
import * as uuid from "uuid";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

import { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const {data} = JSON.parse(event.body!);
  const events = data.map(({provider, event, metadata}: {provider: string, event: object, metadata: object}) => ({
    provider,
    log: event,
    metaData: metadata,
  }));

  for await (const evt of events) {
    const params = {
      TableName: `${process.env.SST_Table_tableName_Events}`,
      Item: {
        id: uuid.v1(),
        provider: evt.provider,
        metaData: evt.metaData,
        log: evt.log,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
    };
    
    await dynamoDb.put(params).promise();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({message: 'success'}),
  };
 
};