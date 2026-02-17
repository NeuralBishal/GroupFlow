import random
import string
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import pyotp
import requests

def generate_otp(length=6):
    """Generate a numeric OTP"""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(email, otp, user_type):
    """Send OTP via email"""
    subject = f'Password Reset OTP - GroupFlow'
    message = f"""
    Hello,
    
    You requested to reset your {user_type} account password.
    
    Your OTP code is: {otp}
    
    This code will expire in 10 minutes.
    
    If you didn't request this, please ignore this email.
    
    Thanks,
    GroupFlow Team
    """
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])

def send_otp_sms(phone, otp):
    """Send OTP via SMS using Twilio (or any SMS service)"""
    # For development, just print to console
    print(f"\n📱 SMS to {phone}: Your OTP is {otp}\n")
    
    # For production with Twilio:
    # from twilio.rest import Client
    # client = Client(settings.TWILIO_SID, settings.TWILIO_AUTH_TOKEN)
    # message = client.messages.create(
    #     body=f"Your GroupFlow OTP is: {otp}. Valid for 10 minutes.",
    #     from_=settings.TWILIO_PHONE,
    #     to=phone
    # )
    return True

def verify_otp(user, otp):
    """Verify OTP against user's stored OTP"""
    if not user.otp_secret or not user.otp_created_at:
        return False
    
    # Check if OTP expired (10 minutes)
    expiry_time = user.otp_created_at + timedelta(minutes=10)
    if timezone.now() > expiry_time:
        return False
    
    # Verify OTP
    return user.otp_secret == otp