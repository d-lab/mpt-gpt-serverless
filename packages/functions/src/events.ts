import AWS from "aws-sdk";
import { v4 as uuid } from 'uuid';
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getPartitionKey } from "./utils";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

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
        pk: getPartitionKey(evt.provider, evt.metaData),
        sk: uuid(),
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