# S3 Utilities — Upload, download, presigned URL helpers

import boto3
from config import settings

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.aws_region,
)


async def upload_file_to_s3(file_bytes: bytes, s3_key: str, content_type: str) -> str:
    """Upload file bytes to S3. Returns the S3 key."""
    s3_client.put_object(
        Bucket=settings.s3_bucket_name,
        Key=s3_key,
        Body=file_bytes,
        ContentType=content_type,
    )
    return s3_key


async def get_presigned_url(s3_key: str, expires_in: int = 3600) -> str:
    """Generate a presigned URL for downloading a file from S3."""
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket_name, "Key": s3_key},
        ExpiresIn=expires_in,
    )


async def download_from_s3(s3_key: str) -> bytes:
    """Download file bytes from S3."""
    response = s3_client.get_object(
        Bucket=settings.s3_bucket_name, Key=s3_key
    )
    return response["Body"].read()
