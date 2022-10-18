# import json

# import requests


def lambda_handler(event, context):
    for rec in event['Records']:
        print('filename=' + rec['s3']['object']['key'])
        print('bucketname=' + rec['s3']['bucket']['name'])
