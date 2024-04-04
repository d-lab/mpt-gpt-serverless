import { Api, Config, StackContext, use, Table, Function } from "sst/constructs";
import * as iam from "aws-cdk-lib/aws-iam";

export function mptGptApiStack({ stack }: StackContext) {
  const table = new Table(stack, "Events", {
    fields: {
      pk: "string",
      sk: "string"
    },
    primaryIndex: {
      partitionKey: "pk",
      sortKey: "sk"
    }
  })
  const GPT_URL = new Config.Secret(stack, "GPT_URL");
  const GPT_TOKEN = new Config.Secret(stack, "GPT_TOKEN");

  const ssmPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
          'ssm:GetParameter'
      ],
      resources: ['*']
  });
  const pyGptLambda = new Function(stack, "PyGPTHandler", {
    handler: "packages/functions/src/python/pygpt.handler",
    enableLiveDev: false,
    runtime: 'python3.9',
    bind: [table, GPT_URL, GPT_TOKEN],
    environment: {
      'GPT_URL': `/sst/mpt-gpt-serverless/${stack.stage}/Secret/GPT_URL/value`,
      'GPT_TOKEN': `/sst/mpt-gpt-serverless/${stack.stage}/Secret/GPT_TOKEN/value`,
      'SYSTEM_PROMPT': 'perform sentiment analysis to output a score in range of 0-100 where 0 means negative and 100 mean positive, return response as a JSON object with 2 keys: "content" (result of the user\'s prompt) and "sentiment" of that result'
    }
  });
  pyGptLambda.addToRolePolicy(ssmPolicy as any);

  const api = new Api(stack, "Api", {
    customDomain:{
      domainName: stack.stage == "prod" ? "api.gpt.dlab-mephisto.com" : "dev.api.gpt.dlab-mephisto.com",
      hostedZone: "dlab-mephisto.com"
    },
    routes: {
      "GET /alive": {
        function: new Function(stack, "AliveHandler", {
          handler: "packages/functions/src/alive.handler",
          bind: [table, GPT_URL, GPT_TOKEN]
        })
      },
      "POST /pygpt": {
        function: pyGptLambda
      },
      "POST /gpt": {
        function: new Function(stack, "GPTHandler", {
          handler: "packages/functions/src/gpt.handler",
          bind: [table, GPT_URL, GPT_TOKEN]
        })
      },
      "POST /events": {
        function: new Function(stack, "EventsHandler", {
          handler: "packages/functions/src/events.handler",
          bind: [table, GPT_URL, GPT_TOKEN]
        })
      },
    }
  })
  
  stack.addOutputs({
    ApiEndpoint: api.url,
  });
  
  return api
}