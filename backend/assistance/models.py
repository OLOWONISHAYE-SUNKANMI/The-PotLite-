from django.db import models
from django.conf import settings
from pots.models import Obligation


class AssistanceStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    APPROVED = 'Approved', 'Approved'
    DENIED = 'Denied', 'Denied'
    REPAID = 'Repaid', 'Repaid'


class AssistanceRequest(models.Model):
    """
    Assistance & Hardship Protocol:
    Private yellow path for families needing installment adjustments or sponsor matching.
    Strict privacy: Bystander parents cannot view assistance records.
    """
    obligation = models.ForeignKey(Obligation, on_delete=models.CASCADE, related_name='assistance_requests')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='filed_assistance_requests')
    requested_amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=AssistanceStatus.choices, default=AssistanceStatus.PENDING)
    private_note = models.TextField(blank=True, default='')
    sponsor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sponsored_assistance')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Assistance: {self.requested_by.username} (${self.requested_amount}) [{self.status}]"


class RepaymentAgreement(models.Model):
    assistance_request = models.ForeignKey(AssistanceRequest, on_delete=models.CASCADE, related_name='repayments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Repayment (${self.amount}) - Due: {self.due_date}"
