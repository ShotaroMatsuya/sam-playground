import json
import os

import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['MAILTABLE'])


def lambda_handler(event, context):
    for rec in event['Records']:
        # バウンスしたメールアドレスの取得
        message = rec['Sns']['Message']
        data = json.loads(message)
        if data['notificationType'] == 'Bounce':
            bounces = data['bounce']['bouncedRecipients']
            for b in bounces:
                email = b['emailAddress']
                # haserrorを1に設定
                table.update_item(
                    Key={'email': email},
                    UpdateExpression="set haserror=:val",
                    ExpressionAttributeValues={
                        ':val': 1
                    }
                )
