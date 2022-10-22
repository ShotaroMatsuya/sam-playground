import json
import os

import boto3


def lambda_handler(event, context):

    if "body" not in event or event["httpMethod"] != "DELETE":
        return {
            "statusCode": 400,
            "headers": {},
            "body": json.dumps({"msg": "Bad Request"}),
        }

    table_name = os.environ.get("DYNAMODB_TABLE", "Posts")
    region = os.environ.get("REGION_NAME", "ap-northeast-1")

    post_table = boto3.resource("dynamodb", region_name=region)

    table = post_table.Table(table_name)
    post_id = event["pathParameters"]["id"]

    params = {
        "id": post_id,
    }

    response = table.delete_item(Key=params)
    print(":::::==>>>", response)
    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "message": "Activity  Deleted",
            }
        ),
    }
