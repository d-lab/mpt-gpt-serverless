import asyncio
import aiohttp
import json
import os
import boto3
import logging

logger = logging.getLogger('PyGPTHandler')

ssm = boto3.client('ssm')
GPT_URL = ssm.get_parameter(Name=os.environ['GPT_URL'], WithDecryption=True)['Parameter']['Value']
GPT_TOKEN = ssm.get_parameter(Name=os.environ['GPT_TOKEN'], WithDecryption=True)['Parameter']['Value']

async def call(
    session: aiohttp.ClientSession,
    **kwargs
) -> dict:
    url = GPT_URL
    resp = await session.post(url, **kwargs)
    data = await resp.json()
    return data

async def _handler(event: dict, context):
    requestBody = json.loads(event.get('body'))
    prompt = requestBody.get('prompt')
    paragraphs = requestBody.get('paragraphs')
    if (len(paragraphs) > 20):
        return {
            'statusCode': 400, 
            'body': json.dumps({
                'message': 'The number of paragraphs is exceeded the limit of 20.'
            })
        }
    for p in paragraphs:
        if (len(p) > 500):
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'message': 'Each paragraph must have less than or equal to 500 characters.'
                })
            }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GPT_TOKEN}"
    }
    async with aiohttp.ClientSession() as session:
        tasks = []
        for p in paragraphs:
            data = {
                'model': 'gpt-3.5-turbo',
                'messages': [
                    {
                        'role': 'system',
                        'content': os.environ['SYSTEM_PROMPT']
                    },
                    {
                        'role': 'user', 
                        'content': prompt + ' ' + p
                    }
                ]
            }
            tasks.append(call(session=session, headers=headers, data=json.dumps(data)))
        responses = await asyncio.gather(*tasks, return_exceptions=True)

    logger.info("Request Paragraphs:")
    logger.info(paragraphs)
    logger.info("Request Prompt:")
    logger.info(prompt)
    logger.info("Responses:")
    logger.info(responses)
    sentiments = []
    summaries = []
    for response in responses:
        hasSentiment = False
        hasSummary = False
        try:
            responseContent = json.loads(response['choices'][0]['message']['content'])
            sentiments.append(responseContent['sentiment'])
            hasSentiment = True
            summaries.append(responseContent['content'])
            hasSummary = True
        except Exception as e:
            logger.error(e)
            if not hasSummary:
                summaries.append(None)
            if not hasSentiment:
                sentiments.append(None)
    avg = filter(lambda x : x is not None, sentiments)
    avg = sum(avg) / (len(sentiments) * 1.0)
    return {
        'statusCode': 200, 
        'body': json.dumps({
            'avg': avg,
            'contents': summaries,
            'sentiments': sentiments
        })
    }

def handler(event: dict, context):
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_handler(event, context))