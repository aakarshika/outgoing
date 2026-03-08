"""QR token generation and verification logic."""

import base64
import hashlib
import hmac
import json
from datetime import timedelta

from django.conf import settings
from django.utils import timezone


class InvalidQRTokenError(Exception):
    """Raised when a QR token is invalid, expired, or tampered with."""
    pass


def _sign(payload: str, secret: str) -> str:
    """Generate an HMAC-SHA256 signature."""
    key = f"{settings.SECRET_KEY}:{secret}".encode('utf-8')
    msg = payload.encode('utf-8')
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


def generate_qr_token(ticket) -> str:
    """Generate a signed QR token for a ticket.
    
    Format: base64(json_payload) + "." + signature
    """
    if not ticket.qr_secret:
        raise ValueError("Ticket does not have a qr_secret.")
        
    payload_dict = {
        "t": ticket.id,
        "e": ticket.event_id,
        "ts": int(timezone.now().timestamp()),
    }
    
    # Base64url encode the payload
    payload_json = json.dumps(payload_dict, separators=(',', ':'))
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode('utf-8')).decode('utf-8').rstrip('=')
    
    signature = _sign(payload_b64, ticket.qr_secret)
    
    return f"{payload_b64}.{signature}"


def verify_qr_token(token: str) -> dict:
    """Verify a signed QR token and return its payload.
    
    Returns a dict with 'ticket_id' and 'event_id'.
    Raises InvalidQRTokenError on failure.
    """
    try:
        payload_b64, signature = token.rsplit('.', 1)
    except ValueError:
        print("[DEBUG] verify_qr_token: Error - Malformed token (no dot)")
        raise InvalidQRTokenError("Malformed QR token.")
        
    print(f"[DEBUG] verify_qr_token: Split into payload_b64 and signature")
        
    # Decode payload
    try:
        # Add padding back if necessary
        padding = '=' * (4 - (len(payload_b64) % 4))
        payload_json = base64.urlsafe_b64decode(payload_b64 + padding).decode('utf-8')
        payload = json.loads(payload_json)
    except Exception as e:
        print(f"[DEBUG] verify_qr_token: Error decoding payload: {e}")
        raise InvalidQRTokenError("Failed to decode token payload.")
    
    print(f"[DEBUG] verify_qr_token: Decoded payload: {payload}")
        
    ticket_id = payload.get("t")
    event_id = payload.get("e")
    
    if not ticket_id or not event_id:
        raise InvalidQRTokenError("Missing required data in token.")
        
    # To verify the signature, we need the ticket's qr_secret
    # Avoid circular imports by importing Ticket locally
    from apps.tickets.models import Ticket
    
    try:
        ticket = Ticket.objects.get(id=ticket_id)
    except Ticket.DoesNotExist:
        raise InvalidQRTokenError("Ticket not found.")
        
    if not ticket.qr_secret:
        raise InvalidQRTokenError("Ticket does not support QR tokens.")
        
    expected_signature = _sign(payload_b64, ticket.qr_secret)
    
    # Use hmac.compare_digest to prevent timing attacks
    if not hmac.compare_digest(signature, expected_signature):
        print(f"[DEBUG] verify_qr_token: Error - Signature mismatch. Expected {expected_signature[:10]}, got {signature[:10]}")
        raise InvalidQRTokenError("Invalid token signature.")
        
    print("[DEBUG] verify_qr_token: SUCCESS")
        
    return {
        "ticket_id": ticket_id,
        "event_id": event_id
    }
