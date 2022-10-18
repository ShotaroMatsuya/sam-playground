import base64
import decimal
import json
import os
import time

import boto3

# DynamoDBオブジェクト
dynamodb = boto3.resource('dynamodb')
# S3オブジェクト
s3 = boto3.client('s3')
# SESオブジェクト
client = boto3.client('ses')

MAILFROM = os.environ['MAILFROM']


def sendmail(to, subject, body):
    client.send_email(
        Source=MAILFROM,
        ReplyToAddress=[MAILFROM],
        Destination={
            'ToAddresses': [
                to
            ]
        },
        Message={
            'Subject': {
                'Data': subject,
                'Charset': 'UTF-8',
            },
            'Body': {
                'Text': {
                    'Data': body,
                    'Charset': 'UTF-8'
                }
            }
        }
    )


# 連番更新
def next_seq(table, tablename):
    response = table.update_item(
        Key={
            'tablename': tablename
        },
        UpdateExpression="set seq = seq + :val",
        ExpressionAttributeValues={
            ':val': 1
        },
        ReturnValues='UPDATE_NEW'
    )
    return response['Attributes']['seq']


def lambda_handler(event, context):
    try:
        # シーケンスデータを取得
        seqtable = dynamodb.Table(os.environ['SEQUENCETABLE'])
        nextseq = next_seq(seqtable, os.environ['USERTABLE'])
        body = event['body']
        if event['isBase64Encoded']:
            body = base64.b64decode(body)
            decoded = json.loads(body)
            username = decoded['username']
            email = decoded['email']
            # クライアントのIPを得る
            host = event['requestContext']['http']['sourceIp']

            now = time.time()
            
            # 署名付きURLを作成
            url = s3.generate_presigned_url(
                ClientMethod='get_object',
                Params={
                    'Bucket': os.environ['SAVEBUCKET'],
                    'Key': 'special.pdf'
                },
                ExpiresIn=8 * 60 * 60,
                HttpMethod='GET' 
            )
            
            # usertableに登録
            usertable = dynamodb.Table('user')
            usertable.put_item(
                Item={
                    'id': nextseq,
                    'username': username,
                    'email': email,
                    'accepted_at': decimal.Decimal(str(now)),
                    'host': host,
                    'url': url
                }
            )
            
            # メール送信
            mailbody = """"
{0}様
ご登録ありがとうございました。
下記のURLからダウンロードできます。
{1}
""".format(username, url)
            sendmail(email, "登録ありがとうございました", mailbody)
            
            return json.dumps({})
    except Exception:
        import traceback
        err = traceback.format_exc()
        print(err)
        
        return {
            'statusCode': 500,
            'headers': {
                'content-type': 'text/json'
            },
            'body': json.dumps({
                'error': '内部エラーが発生しました'
            })
        }
