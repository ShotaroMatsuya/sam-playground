import os

import boto3
from aws_xray_sdk.core import patch_all

patch_all()
sqs = boto3.resource('sqs')
s3 = boto3.resource('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('mailaddress')
client = boto3.client('ses')
# メール送信元
MAILFROM = os.environ['MAILADDRESS']


# queueをうけとってmail送信
def lambda_handler(event, context):
    for rec in event['Records']:
        email = rec['body']
        bucketname = rec['messageAttributes']['bucketname']['stringValue']
        filename = rec['messageAttributes']['filename']['stringValue']
        username = rec['messageAttributes']['username']['stringValue']
        
        obj = s3.Object(bucketname, filename)
        response = obj.get()
        maildata = response['Body'].read().decode('utf-8')
        data = maildata.split("\n", 3)
        subject = data[0]
        body = data[2]
        # 送信済みでないことを確認し、送信済みにする
        response = table.update_item(
            Key={
                'email': email
            },
            UpdateExpression="set issend=:val",
            ExpressionAttributeValues={
                ':val': 1
            },
            ReturnValues='UPDATED_OLD'  # ここが0であれば送信
        )
        # 未送信なら送信
        if response['Attributes']['issend'] == 0:
            # メール送信
            response = client.send_email(
                Source=MAILFROM,
                ReplyToAddresses=[MAILFROM],
                Destination={
                    'ToAddresses': [
                        email
                    ]
                },
                Message={
                    'Subject': {
                        'Data': subject,
                        'Charset': 'UTF-8'
                    },
                    'Body': {
                        'Text': {
                            'Data': body,
                            'Charset': 'UTF-8'
                        }
                    }
                }
            )
        else:
            print("Resend skip")
