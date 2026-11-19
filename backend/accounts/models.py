from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import random


class UserRole(models.TextChoices):
    ORGANIZER = 'Organizer', 'Organizer (Coach / Director)'
    MEMBER = 'Member', 'Member (Parent / Guardian)'


class User(AbstractUser):
    phone = models.CharField(max_length=32, blank=True, null=True, db_index=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.ORGANIZER)
    title = models.CharField(max_length=120, blank=True, null=True)
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=64, blank=True, null=True)
    two_factor_backup_codes = models.JSONField(default=list, blank=True)
    profile_picture = models.TextField(blank=True, null=True)
    onboarding_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_full_name() or self.username}) - {self.role}"


class SMSVerification(models.Model):
    phone = models.CharField(max_length=32, db_index=True)
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def generate_code(cls, phone: str):
        code = str(random.randint(100000, 999999))
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        # Invalidate previous codes for this phone
        cls.objects.filter(phone=phone).delete()
        return cls.objects.create(phone=phone, code=code, expires_at=expires_at)

    def is_valid(self, input_code: str) -> tuple[bool, str]:
        if timezone.now() > self.expires_at:
            return False, "Verification code has expired. Please request a new one."
        if self.attempts >= 5:
            return False, "Too many failed attempts. Please request a new code."
        self.attempts += 1
        self.save(update_fields=['attempts'])
        if self.code != input_code.strip():
            return False, "Incorrect verification code. Please check and try again."
        return True, ""
