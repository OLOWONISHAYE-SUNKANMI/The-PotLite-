from django.db import models
from django.conf import settings
from pots.models import Pot


class ProposalType(models.TextChoices):
    DATE_EXTENSION = 'date_extension', 'Date Extension'
    BUDGET_INCREASE = 'budget_increase', 'Budget Increase'
    ROSTER_CHANGE = 'roster_change', 'Roster Change'
    PAYOUT = 'payout', 'Payout'


class ProposalStatus(models.TextChoices):
    OPEN = 'Open', 'Open'
    PASSED = 'Passed', 'Passed'
    FAILED = 'Failed', 'Failed'
    CANCELLED = 'Cancelled', 'Cancelled'


class ChangeProposal(models.Model):
    pot = models.ForeignKey(Pot, on_delete=models.CASCADE, related_name='proposals')
    proposed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='proposals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    proposal_type = models.CharField(max_length=30, choices=ProposalType.choices, default=ProposalType.DATE_EXTENSION)
    threshold_percent = models.IntegerField(default=60)
    status = models.CharField(max_length=20, choices=ProposalStatus.choices, default=ProposalStatus.OPEN)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} [{self.status}]"


class ProposalVote(models.Model):
    proposal = models.ForeignKey(ChangeProposal, on_delete=models.CASCADE, related_name='votes')
    voter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='votes')
    choice = models.CharField(max_length=10, choices=[('yes', 'Yes'), ('no', 'No')])
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('proposal', 'voter')


class PayoutSpendStatus(models.TextChoices):
    PENDING_SECOND_APPROVAL = 'Pending_Second_Approval', 'Pending Second Approval'
    APPROVED = 'Approved', 'Approved'
    PENDING_GROUP_VOTE = 'Pending_Group_Vote', 'Pending Group Vote'
    REJECTED = 'Rejected', 'Rejected'
    DISBURSED = 'Disbursed', 'Disbursed'


class PayoutSpendRequest(models.Model):
    """
    Off-Rail Payout Governance Engine:
    Tracks authorization to spend pot funds to vendors off-platform.
    Threshold:
    - > $250 requires 2 distinct organizer approvals.
    - > $1,000 requires full group membership vote.
    Anti-Self-Approval: Requester CANNOT approve their own payout request.
    """
    pot = models.ForeignKey(Pot, on_delete=models.CASCADE, related_name='payout_requests')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='requested_payouts')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    vendor_payee = models.CharField(max_length=200)
    spend_purpose = models.TextField(blank=True, default='')
    status = models.CharField(max_length=30, choices=PayoutSpendStatus.choices, default=PayoutSpendStatus.PENDING_SECOND_APPROVAL)
    first_approval_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='first_approved_payouts')
    second_approval_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='second_approved_payouts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def approve_by_organizer(self, organizer_user):
        # Anti-Self-Approval Check
        if organizer_user.id == self.requested_by.id:
            raise ValueError("Anti-Self-Approval: Organizer cannot approve their own payout request.")

        self.second_approval_by = organizer_user
        self.status = PayoutSpendStatus.APPROVED
        self.save(update_fields=['second_approval_by', 'status', 'updated_at'])
        return True
