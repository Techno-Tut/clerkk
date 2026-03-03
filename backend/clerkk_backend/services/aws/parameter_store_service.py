import boto3
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)


class ParameterStoreService:
    """AWS Systems Manager Parameter Store client for retrieving secrets."""

    def __init__(self, region: str = "ap-south-1"):
        self.client = boto3.client("ssm", region_name=region)
        self.region = region
        logger.info(f"ParameterStoreService initialized for region: {region}")

    @lru_cache(maxsize=50)
    def get_parameter(self, name: str, decrypt: bool = True) -> str:
        """
        Get a parameter value from Parameter Store.

        Args:
            name: Parameter name (e.g., '/inbriefs/prod/razorpay/key_id')
            decrypt: Whether to decrypt SecureString parameters

        Returns:
            Parameter value as string

        Raises:
            ValueError if parameter not found
        """
        try:
            response = self.client.get_parameter(Name=name, WithDecryption=decrypt)
            value = response["Parameter"]["Value"]
            logger.info(f"Retrieved parameter: {name}")
            return value
        except self.client.exceptions.ParameterNotFound:
            logger.error(f"Parameter not found: {name}")
            raise ValueError(f"Parameter not found: {name}")
        except Exception as e:
            logger.error(f"Error retrieving parameter {name}: {str(e)}")
            raise
