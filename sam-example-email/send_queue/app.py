import json
import os

import boto3
from boto3.dynamodb.conditions import Key


def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['MAILTABLE'])

    sqs = boto3.resource('sqs')
    print(os.environ['QUEUENAME'])
    queue = sqs.get_queue_by_name(QueueName=os.environ['QUEUENAME'])
    for rec in event['Records']:
        bucketname = rec['s3']['bucket']['name']
        filename = rec['s3']['object']['key']
        # haserrorが0のものを取得
        response = table.query(
            IndexName='haserror-index',
            KeyConditionExpression=Key('haserror').eq(0)
        )

        for item in response['Items']:
            # issendを0にする
            table.update_item(
                Key={'email': item['email']},
                UpdateExpression="set issend=:val",
                ExpressionAttributeValues={
                    ':val': 0
                }
            )
            # SQSにメッセージとして登録
            sqsresponse = queue.send_message(
                MessageBody=item['email'],
                MessageAttributes={
                    'username': {
                        'DataType': 'String',
                        'StringValue': item['username']
                    },
                    'bucketname': {
                        'DataType': 'String',
                        'StringValue': bucketname
                    },
                    'filename': {
                        'DataType': 'String',
                        'StringValue': filename
                    }
                }
            )
            # 結果をログに出力しておく
            print(json.dumps(sqsresponse))
