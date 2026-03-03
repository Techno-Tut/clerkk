"""S3 Service for file uploads"""

import boto3
from botocore.exceptions import ClientError
import uuid
import logging

logger = logging.getLogger(__name__)


class S3Service:
    """Service for uploading files to S3"""

    def __init__(self, bucket_name: str, region: str = "ap-south-1", prefix: str = ""):
        self.bucket_name = bucket_name
        self.region = region
        self.prefix = prefix
        self.s3_client = boto3.client("s3", region_name=region)

    def upload_file(
        self, file_content: bytes, filename: str, content_type: str = None
    ) -> str:
        """Upload file to S3 and return S3 key"""
        # Use the provided filename directly (caller provides full path like "invoices/xxx.pdf")
        s3_key = f"{self.prefix}{filename}"

        try:
            extra_args = {}
            if content_type:
                extra_args["ContentType"] = content_type

            self.s3_client.put_object(
                Bucket=self.bucket_name, Key=s3_key, Body=file_content, **extra_args
            )

            logger.info(f"Uploaded file to S3: {s3_key}")
            return s3_key

        except ClientError as e:
            logger.error(f"Failed to upload to S3: {str(e)}")
            raise ValueError(f"Failed to upload file: {str(e)}")
