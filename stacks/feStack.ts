import { StackContext, StaticSite, use } from "sst/constructs";
import "dotenv/config";
import { mptGptApiStack } from "./beStack";


export function mptGptWebStack({stack}: StackContext) {
  if (process.env.REACT_APP_API_URL == "") {
    return "REACT_APP_API_URL is not defined"
  }
  const web = new StaticSite(stack, "web", {
    path: "packages/web",
    customDomain: {
      domainName: stack.stage == "prod" ? "gpt.dlab-mephisto.com" : "dev.gpt.dlab-mephisto.com",
      hostedZone: "dlab-mephisto.com"
    },
    buildOutput: "build",
    buildCommand: "npm run build",
    environment: {
      REACT_APP_API_URL: process.env.REACT_APP_API_URL || "",
    },
  })
  
  stack.addOutputs({
    Web: web.url
  })
}