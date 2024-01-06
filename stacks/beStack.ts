import { Api, Config, StackContext, use, Table } from "sst/constructs";

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

  const api = new Api(stack, "Api", {
    customDomain:{
      domainName: stack.stage == "prod" ? "api.gpt.dlab-mephisto.com" : "dev.api.gpt.dlab-mephisto.com",
      hostedZone: "dlab-mephisto.com"
    },
    defaults: {
      function: {
        bind: [table, GPT_URL, GPT_TOKEN],
      }
    },
    routes: {
      "GET /alive": "packages/functions/src/alive.handler",
      "POST /gpt": "packages/functions/src/gpt.handler",
      "POST /events": "packages/functions/src/events.handler",
    }
  })
  
  stack.addOutputs({
    ApiEndpoint: api.url,
  });
  
  return api
}