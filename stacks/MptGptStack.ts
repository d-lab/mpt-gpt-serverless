// import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Scope } from "aws-cdk-lib/aws-ecs";
import { Api, Config, StackContext, StaticSite, Table, use } from "sst/constructs";

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
    defaults: {
      function: {
        bind: [table, GPT_URL, GPT_TOKEN]
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

export function mptGptWebStack({stack}: StackContext) {
  const api = use(mptGptApiStack);
  const web = new StaticSite(stack, "web", {
    path: "packages/web",
    customDomain: {
      domainName: stack.stage == "prod" ? "gpt.mephisto.aufederal2022.com" : "dev.gpt.mephisto.aufederal2022.com",
      hostedZone: "aufederal2022.com"
    },
    buildOutput: "build",
    buildCommand: "npm run build",
    environment: {
      REACT_APP_API_URL: api.url,
    },
  })

  stack.addOutputs({
    Web: web.url
  })
}