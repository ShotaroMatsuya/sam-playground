import os
import uuid
from datetime import datetime
from io import BytesIO

import boto3
from PIL import Image, ImageOps

s3 = boto3.client("s3")
size = int(os.getenv("THUMBNAIL_SIZE"))


def s3_thumbnail_generator(event, context):
    print("Event::", event)

    bucket = event["Records"][0]["s3"]["bucket"]["name"]
    key = event["Records"][0]["s3"]["object"]["key"]
    img_size = event["Records"][0]["s3"]["object"]["size"]

    if not key.endswith("_thumbnail.png"):
        image = get_s3_image(bucket, key)
        thumbnail = image_to_thumbnail(image)
        thumbnail_key = new_filename(key)
        url = upload_to_s3(bucket, thumbnail_key, thumbnail, img_size)

        return url


def get_s3_image(bucket, key):
    response = s3.get_object(Bucket=bucket, Key=key)
    imageContent = response["Body"].read()

    file = BytesIO(imageContent)
    img = Image.open(file)
    return img


def image_to_thumbnail(image):
    return ImageOps.fit(image, (size, size), Image.ANTIALIAS)


def new_filename(key):
    key_split = key.rsplit(".", 1)
    return key_split[0] + "_thumbnail.png"


def upload_to_s3(bucket, key, image, img_size):
    # We're saving the image into a BytesIO object to avoid writing to disk
    out_thumbnail = BytesIO()
    # You MUST specify the file type because there is no file name to discern it from
    image.save(out_thumbnail, "PNG")
    out_thumbnail.seek(0)

    response = s3.put_object(
        ACL="public-read",
        Body=out_thumbnail,
        Bucket=bucket,
        ContentType="image/png",
        Key=key,
    )
    print(response)

    url = "{}/{}/{}".format(s3.meta.endpoint_url, bucket, key)

    # save image url to db:
    # s3_save_thumbnail_url_to_dynamo(url_path=url, img_size=img_size)

    return url
