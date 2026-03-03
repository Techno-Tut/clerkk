import boto3
import json
from typing import Dict, Any


class SQSService:
    def __init__(self, queue_url: str, region: str = "ap-south-1"):
        self.queue_url = queue_url
        self.sqs = boto3.client("sqs", region_name=region)

    def send_message(
        self,
        message_body: Dict[str, Any],
        message_attributes: Dict[str, Dict[str, str]] = None,
    ) -> str:
        """
        Generic method to send message to SQS queue.
        Returns message ID.
        """
        params = {"QueueUrl": self.queue_url, "MessageBody": json.dumps(message_body)}

        if message_attributes:
            params["MessageAttributes"] = message_attributes

        response = self.sqs.send_message(**params)
        return response["MessageId"]
