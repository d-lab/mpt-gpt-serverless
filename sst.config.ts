import { SSTConfig } from "sst";
import { mptGptApiStack, mptGptWebStack } from "./stacks/MptGptStack";

export default {
  config(_input) {
    return {
      name: "mpt-gpt-serverless",
      stage: process.env.SST_STAGE,
      profile: "279615518931_svc",
      region: "ap-southeast-2"
    };
  },
  stacks(app) {
    app.stack(mptGptApiStack).stack(mptGptWebStack);
  }
} satisfies SSTConfig;
