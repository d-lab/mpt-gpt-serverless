import { SSTConfig } from "sst";
import { mptGptApiStack, mptGptWebStack } from "./stacks/MptGptStack";

export default {
  config(_input) {
    return {
      name: "mpt-gpt-serverless",
      stage: process.env.SST_STAGE || "dev",
      region: "ap-southeast-2"
    };
  },
  stacks(app) {
    app.stack(mptGptApiStack).stack(mptGptWebStack);
  }
} satisfies SSTConfig;
