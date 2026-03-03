"""
Lambda handler for processing payment webhook events from SQS.
Triggered by SQS queue: inbriefs-payment-webhooks-{env}
"""

import json
import logging
import os
from pathlib import Path

from clerkk_backend.core.container import Container

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


def handler(event, context):
    """
    Process payment webhook events from SQS.

    Event structure:
    {
        "Records": [{
            "body": "{
                "event_type": "payment.captured",
                "event_id": "evt_xxx",
                "payload": {...}
            }"
        }]
    }
    """
    # Get wallet service from container
    container = get_container()
    wallet_service = container.wallet_service()

    for record in event["Records"]:
        try:
            # Parse SQS message
            message = json.loads(record["body"])
            event_type = message["event_type"]
            event_id = message["event_id"]
            payload = message["payload"]

            logger.info(f"Processing webhook: {event_type}, Event ID: {event_id}")

            # Handle different event types
            if event_type == "payment.captured":
                handle_payment_captured(wallet_service, payload, event_id)
            elif event_type == "payment.failed":
                handle_payment_failed(wallet_service, payload, event_id)
            else:
                logger.warning(f"Unhandled event type: {event_type}")

            logger.info(f"Successfully processed event: {event_id}")

        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
            # Re-raise to send to DLQ after retries
            raise

    return {"statusCode": 200, "body": "Processed"}


def handle_payment_captured(wallet_service, payload: dict, event_id: str):
    """Handle payment.captured event"""
    payment = payload["payload"]["payment"]["entity"]
    order_id = payment["order_id"]
    payment_id = payment["id"]

    logger.info(f"Payment captured: order={order_id}, payment={payment_id}")

    # Process payment and update wallet
    wallet_service.verify_payment_from_webhook(order_id, payment_id)
    logger.info(f"Payment processed successfully: {payment_id}")

    # Generate invoice (separate from payment processing)
    try:
        container = get_container()
        invoice_service = container.invoice_service()
        organization_service = container.organization_service()

        ledger = wallet_service.get_ledger_by_order_id(order_id)
        org = organization_service.get_organization(ledger.organization_id)

        invoice_service.generate_tax_invoice(ledger, org)
        logger.info(f"Generated invoice for ledger: {ledger.ledger_id}")
    except Exception as e:
        # Don't fail webhook if invoice generation fails
        logger.error(f"Failed to generate invoice: {str(e)}", exc_info=True)


def handle_payment_failed(wallet_service, payload: dict, event_id: str):
    """Handle payment.failed event"""
    payment = payload["payload"]["payment"]["entity"]
    order_id = payment["order_id"]
    payment_id = payment["id"]
    error_description = payment.get("error_description", "Unknown error")

    logger.info(
        f"Payment failed: order={order_id}, payment={payment_id}, error={error_description}"
    )

    # Update payment transaction to FAILED
    wallet_service.mark_payment_failed(order_id, payment_id, error_description)

    logger.info(f"Payment marked as failed: {payment_id}")
