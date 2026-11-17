import base64
import os
import pyotp
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login, logout
from django.db.models import Q
from .models import User, SMSVerification
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer
from .twilio_service import send_sms_otp, normalize_phone_number


class RegisterView(APIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            first_err = next(iter(errors.values()))[0] if errors else "Validation error"
            return Response({"error": first_err, "details": errors}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        login(request, user)
        return Response({
            "message": "Registered successfully",
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": "Username/email and password required."}, status=status.HTTP_400_BAD_REQUEST)

        query = serializer.validated_data['usernameOrEmail'].strip().lower()
        password = serializer.validated_data['password']

        # Flexible query matching: username, email, normalized username, phone, or full name
        normalized_user_query = query.replace(' ', '_').replace('-', '_')
        clean_alphanumeric = ''.join(c for c in query if c.isalnum())

        q_filter = (
            Q(username__iexact=query) |
            Q(username__iexact=normalized_user_query) |
            Q(email__iexact=query)
        )
        if clean_alphanumeric and len(clean_alphanumeric) >= 4:
            q_filter |= Q(phone__icontains=clean_alphanumeric)

        name_parts = query.split()
        if len(name_parts) >= 2:
            q_filter |= (Q(first_name__iexact=name_parts[0]) & Q(last_name__iexact=name_parts[-1]))
            q_filter |= (Q(first_name__icontains=name_parts[0]) & Q(last_name__icontains=name_parts[-1]))
        elif len(name_parts) == 1:
            q_filter |= Q(first_name__iexact=name_parts[0]) | Q(last_name__iexact=name_parts[0])

        user = User.objects.filter(q_filter).first()

        if not user:
            return Response({
                "error": "No account found matching this username or email. Please check your spelling or register a new account."
            }, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response({
                "error": "Incorrect password. Please verify your password and try again."
            }, status=status.HTTP_400_BAD_REQUEST)

        if user.two_factor_enabled:
            return Response({
                "requiresTwoFactor": True,
                "userId": user.id,
                "username": user.username,
                "message": "Please enter your 6-digit two-factor authentication code."
            }, status=status.HTTP_200_OK)

        login(request, user)
        return Response({
            "requiresTwoFactor": False,
            "user": UserSerializer(user).data,
            "message": "Authenticated successfully"
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({"message": "Logged out"}, status=status.HTTP_200_OK)


class MeView(APIView):
    serializer_class = UserSerializer

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(UserSerializer(request.user).data)


class SendSMSView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        raw_phone = request.data.get('phone', '').strip()
        if not raw_phone:
            return Response({"error": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        phone = normalize_phone_number(raw_phone)
        verification = SMSVerification.generate_code(phone)
        result = send_sms_otp(phone, verification.code)
        return Response(result, status=status.HTTP_200_OK)


class VerifySMSView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        raw_phone = request.data.get('phone', '').strip()
        code = request.data.get('code', '').strip()
        user_id = request.data.get('userId')

        if not raw_phone or not code:
            return Response({"error": "Phone and 6-digit code are required."}, status=status.HTTP_400_BAD_REQUEST)

        phone = normalize_phone_number(raw_phone)
        record = SMSVerification.objects.filter(phone=phone).first()

        if not record:
            return Response({"error": "No active verification code found for this phone number. Please request a new code."}, status=status.HTTP_400_BAD_REQUEST)

        is_valid, err_msg = record.is_valid(code)
        if not is_valid:
            return Response({"error": err_msg}, status=status.HTTP_400_BAD_REQUEST)

        # Verification succeeded: delete record to prevent replay
        record.delete()

        # Update user if authenticated or user_id passed
        user = None
        if user_id:
            user = User.objects.filter(id=user_id).first()
        elif request.user.is_authenticated:
            user = request.user

        if user:
            user.phone = phone
            user.two_factor_enabled = True
            user.save(update_fields=['phone', 'two_factor_enabled'])
            login(request, user)
            return Response({
                "message": "Two-factor verification successful",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        return Response({
            "message": "Two-factor verification successful",
            "phone": phone
        }, status=status.HTTP_200_OK)


class SetupTwoFactorView(APIView):
    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        user_id = request.data.get('userId')
        if not user and user_id:
            user = User.objects.filter(id=user_id).first()

        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        secret = pyotp.random_base32()
        user.two_factor_secret = secret
        user.save(update_fields=['two_factor_secret'])

        totp = pyotp.TOTP(secret)
        otp_auth_url = totp.provisioning_uri(name=user.email or user.username, issuer_name="ThePotLite")

        return Response({
            "secret": secret,
            "otpAuthUrl": otp_auth_url
        }, status=status.HTTP_200_OK)


class VerifyTwoFactorView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('userId')
        code = request.data.get('code', '').strip()

        user = User.objects.filter(id=user_id).first() if user_id else (request.user if request.user.is_authenticated else None)
        if not user or not user.two_factor_secret:
            return Response({"error": "2FA not configured"}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(code, valid_window=1):
            return Response({"error": "Invalid two-factor authentication code"}, status=status.HTTP_401_UNAUTHORIZED)

        user.two_factor_enabled = True
        user.save(update_fields=['two_factor_enabled'])
        login(request, user)

        return Response({
            "message": "Two-factor verification successful",
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)
