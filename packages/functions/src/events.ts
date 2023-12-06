import AWS from "aws-sdk";
import { v4 as uuid } from 'uuid';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

import { APIGatewayProxyHandlerV2 } from "aws-lambda";

const getPartitionKey = (provider: string, metaData: any) => {
  if (provider === "prolific") {
    return metaData.prolific_study_id;
  }
  if (provider === "mturk" || provider === "mturk_sandbox") {
    return metaData.hit_id;
  }
  return uuid();
}
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