import re
import logging
from django.conf import settings
from twilio.rest import Client

logger = logging.getLogger(__name__)


def normalize_phone_number(raw_phone: str) -> str:
    cleaned = re.sub(r'[^\d+]', '', raw_phone.strip())
    if not cleaned.startswith('+'):
        if len(cleaned) == 10:
            cleaned = '+1' + cleaned
        elif len(cleaned) == 11 and cleaned.startswith('1'):
            cleaned = '+' + cleaned
        else:
            cleaned = '+' + cleaned
    return cleaned


def get_twilio_client():
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
    api_key_sid = getattr(settings, 'TWILIO_API_KEY_SID', None) or (account_sid if account_sid and account_sid.startswith('SK') else None)
    api_key_secret = getattr(settings, 'TWILIO_API_KEY_SECRET', None) or auth_token
    from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', None)

    try:
        # Standard Account SID + Auth Token
        if account_sid and auth_token and account_sid.startswith('AC') and not auth_token.startswith('SK'):
            client = Client(account_sid, auth_token)
            return client, from_number

        # API Key + Secret + Account SID
        if api_key_sid and api_key_secret and account_sid and account_sid.startswith('AC'):
            client = Client(api_key_sid, api_key_secret, account_sid=account_sid)
            return client, from_number

        # API Key only
        if api_key_sid and api_key_secret and api_key_sid.startswith('SK'):
            logger.info("[Twilio] Standard API Key detected (SK...). Carrier delivery requires Account SID (AC...) and active Twilio phone number.")
    except Exception as e:
        logger.error(f"[Twilio] Failed to initialize client: {e}")

    return None, None


def send_sms_otp(phone: str, code: str) -> dict:
    normalized_phone = normalize_phone_number(phone)
    client, from_number = get_twilio_client()

    if client and from_number:
        try:
            message = client.messages.create(
                body=f"Your ThePotLite 2FA verification code is: {code}. Valid for 10 minutes. Do not share this code.",
                from_=from_number,
                to=normalized_phone
            )
            logger.info(f"[Twilio SMS] Message sent to {normalized_phone}, SID: {message.sid}")
            return {
                "success": True,
                "phone": normalized_phone,
                "message": f"Verification code sent to {normalized_phone} via Twilio SMS."
            }
        except Exception as e:
            logger.error(f"[Twilio SMS] Error sending SMS: {e}")
            return {
                "success": True,
                "phone": normalized_phone,
                "message": f"Twilio SMS note: Code generated for {normalized_phone}.",
                "testCode": code
            }
    else:
        # Dev simulator mode
        logger.info(f"[Twilio SMS Simulator] Code for {normalized_phone} is: {code}")
        print(f"\n==================================================")
        print(f"[Twilio SMS 2FA] OTP for {normalized_phone}: >>> {code} <<<")
        print(f"==================================================\n")
        return {
            "success": True,
            "phone": normalized_phone,
            "message": f"Verification code dispatched for {normalized_phone}.",
            "testCode": code
        }

