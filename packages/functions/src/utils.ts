import { v4 as uuid } from 'uuid';

export const getPartitionKey = (provider: string, metaData: any) => {
  if (provider === "prolific") {
    return metaData.prolific_study_id;
  }
  if (provider === "mturk" || provider === "mturk_sandbox") {
    return metaData.hit_id;
  }
  return uuid();
}