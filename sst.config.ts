import { SSTConfig } from "sst";
import { mptGptApiStack } from "./stacks/beStack";
import { mptGptWebStack } from "./stacks/feStack";

export default {  
  config(input) {
    return {
      name: "mpt-gpt-serverless",
      stage: process.env.SST_STAGE || "dev",
      region: "ap-southeast-2"
    };
  },
  stacks: (app) => {
    if (process.argv[4] =='api') {
     app.stack(mptGptApiStack)
    }
    else if (process.argv[4]=='web') {
      app.stack(mptGptWebStack)
    }
    else {
      app.stack(mptGptApiStack)
         .stack(mptGptWebStack)
    }
  }
} satisfies SSTConfig;
