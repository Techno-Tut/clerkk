"""
Lambda handler for campaign status change events.
Processes SQS messages and triggers appropriate actions.
"""

import json
import logging
import os
from pathlib import Path
from clerkk_backend.core.container import Container
from clerkk_backend.models.campaign import CampaignStatus

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize container lazily
_container = None


def get_container():
    """Lazy initialization of container"""
    global _container
    if _container is None:
        _container = Container()
        environment = os.getenv("ENVIRONMENT", "production")
        config_path = Path(__file__).parent.parent / "config" / f"{environment}.yaml"
        _container.config.from_yaml(str(config_path), required=True, envs_required=True)
    return _container


def lambda_handler(event, context):
    """
    Process SQS messages for campaign status changes.
    Returns batch item failures for partial retry.

    Event structure:
    {
        "Records": [
            {
                "messageId": "...",
                "body": "{\"event_type\": \"campaign_status_changed\", \"campaign_data\": {...}}"
            }
        ]
    }
    """
    logger.info(f"Processing {len(event['Records'])} messages")

    batch_item_failures = []

    for record in event["Records"]:
        try:
            message = json.loads(record["body"])
            event_type = message.get("event_type")
            campaign_data = message.get("campaign_data", {})

            # Validate required fields
            if not campaign_data.get("campaign_id") or not campaign_data.get(
                "organization_id"
            ):
                logger.error(f"Missing required fields in message: {message}")
                continue  # Skip invalid message

            logger.info(
                f"Processing event: {event_type} for campaign {campaign_data.get('campaign_id')}"
            )

            if event_type == "campaign_status_changed":
                handle_status_change(campaign_data)
            else:
                logger.warning(f"Unknown event type: {event_type}")

        except Exception as e:
            logger.error(
                f"Failed to process message {record.get('messageId')}: {e}",
                exc_info=True,
            )
            # Add to batch failures for retry
            batch_item_failures.append({"itemIdentifier": record["messageId"]})

    return {"batchItemFailures": batch_item_failures}


def handle_status_change(campaign_data: dict):
    """Handle campaign status change event"""
    new_status = campaign_data.get("new_status")
    old_status = campaign_data.get("old_status")
    campaign_id = campaign_data.get("campaign_id")
    organization_id = campaign_data.get("organization_id")

    logger.info(
        f"Status change: {old_status} -> {new_status} for campaign {campaign_id}"
    )

    # Only process COMPLETED status (and not already COMPLETED)
    if (
        new_status == CampaignStatus.COMPLETED.value
        and old_status != CampaignStatus.COMPLETED.value
    ):
        process_campaign_completion(campaign_id, organization_id)


def process_campaign_completion(campaign_id: str, organization_id: str):
    """
    Process campaign completion:
    1. Check if already processed (idempotency)
    2. Get sum of execution locked_rates
    3. Deduct from wallet balance
    4. Create ledger entry
    5. Update campaign status to PROCESSED
    """
    container = get_container()
    wallet_service = container.wallet_service()
    campaign_service = container.campaign_service()

    try:
        # Get campaign details
        campaign = campaign_service.get_campaign_by_id_ops_only(campaign_id)

        # Idempotency check - check status first
        if campaign.status == CampaignStatus.PROCESSED:
            logger.info(f"Campaign {campaign_id} already PROCESSED, skipping")
            return

        # Additional idempotency check - check if payment already deducted
        if wallet_service.has_campaign_payment(campaign_id):
            logger.warning(
                f"Campaign {campaign_id} payment already exists in ledger, updating status only"
            )
            # Payment already deducted, just update status
            campaign_service.update_campaign_status_ops_only(
                campaign_id, CampaignStatus.PROCESSED.value
            )
            return

        # Get executions and sum locked_rates
        executions = campaign_service.get_executions(campaign_id, organization_id)
        total_amount = sum(exec_data.get("locked_rate", 0) for exec_data in executions)

        if total_amount == 0:
            logger.error(
                f"Campaign {campaign_id} has no executions with locked rates, cannot process payment"
            )
            raise ValueError(f"Campaign {campaign_id} has zero execution cost")

        # Deduct payment from wallet
        wallet_service.deduct_campaign_payment(
            organization_id=organization_id,
            campaign_id=campaign_id,
            amount=total_amount,
            description=f"Redeem against {campaign_id} | {campaign.title}",
        )

        # Update campaign status to PROCESSED (releases hold)
        campaign_service.update_campaign_status_ops_only(
            campaign_id, CampaignStatus.PROCESSED.value
        )
        logger.info(
            f"Successfully processed campaign {campaign_id}: deducted ₹{total_amount}, status -> PROCESSED"
        )

    except Exception as e:
        logger.error(
            f"Failed to process campaign completion for {campaign_id}: {e}",
            exc_info=True,
        )
        raise  # Let SQS retry
