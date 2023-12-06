# mpt-gpt-serverless
node version >= 18.8.8
![architecture](mpt-gpt.png "Architecture")

# How to run:
## set up aws credentials:
  - install aws-cli
  - Copy key id and secret key on aws
  - On ubuntu terminal:
    + sudo su
    + cd .aws
    + vim credentials
    + paste key to credentials file

## How to setup environment
 - npx sst secrets set GPT_URL {url}
 - npx sst secrets set GPT_TOKEN {token}

## How to run
  - npm install
  - npm run dev: run dev environment
  - npm run build: build project
  - npm run deploy: deploy as production
  - npm run remove: remove from aws cloudfront

## How to run Front end
  - Run in folder web: cd packages/web
  - npm run dev