from django.db import models
from django.conf import settings
from organizations.models import Organization, Team, Player


class PotType(models.TextChoices):
    SEASON_FEE = 'season fee', 'Season Fee'
    TOURNAMENT = 'tournament', 'Tournament'
    UNIFORMS_GEAR = 'uniforms and gear', 'Uniforms and Gear'
    TRAVEL = 'travel', 'Travel'
    FUNDRAISER = 'fundraiser', 'Fundraiser'
    OTHER = 'other', 'Other'


class PotStatus(models.TextChoices):
    DRAFT = 'Draft', 'Draft'
    ACTIVE = 'Active', 'Active'
    COMPLETED = 'Completed', 'Completed'
    CANCELLED = 'Cancelled', 'Cancelled'


class Pot(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='pots')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='pots')
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_pots')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    pot_type = models.CharField(max_length=50, choices=PotType.choices, default=PotType.SEASON_FEE)
    total_target_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    per_member_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=PotStatus.choices, default=PotStatus.ACTIVE)
    due_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (${self.total_target_amount}) - {self.team.name}"

    def check_auto_completion(self) -> bool:
        """
        Auto-completion: Pot automatically marks completed when all active obligations are 'Confirmed'.
        """
        active_obs = self.obligations.exclude(state__in=['Cancelled'])
        if not active_obs.exists():
            return False
        all_confirmed = not active_obs.exclude(state__in=['Confirmed', 'Completed']).exists()
        if all_confirmed and self.status != PotStatus.COMPLETED:
            self.status = PotStatus.COMPLETED
            self.save(update_fields=['status'])
            return True
        return False


class ObligationState(models.TextChoices):
    INVITED = 'Invited', 'Invited'
    ACCEPTED = 'Accepted', 'Accepted'
    STATEMENT_FILED = 'Statement_Filed', 'Statement Filed'
    CONFIRMED = 'Confirmed', 'Confirmed'
    DISPUTED = 'Disputed', 'Disputed'
    CANCELLED = 'Cancelled', 'Cancelled'
    COMPLETED = 'Completed', 'Completed'


class Obligation(models.Model):
    """
    Core Domain Object in ThePotLite V1:
    Obligations are versioned, consent-gated, and non-custodial.
    """
    pot = models.ForeignKey(Pot, on_delete=models.CASCADE, related_name='obligations')
    member = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='obligations')
    player = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='obligations')
    state = models.CharField(max_length=25, choices=ObligationState.choices, default=ObligationState.INVITED)
    active_version = models.IntegerField(default=1)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    balance_remaining = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    last_activity_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.member.username} - {self.pot.name} (${self.total_amount}) [{self.state}]"

    def accept_invite(self):
        if self.state == ObligationState.INVITED:
            self.state = ObligationState.ACCEPTED
            self.save(update_fields=['state', 'last_activity_at'])
            return True
        return False

    def withdraw(self, reason: str = ''):
        """
        Phase 3: Opt-Out & Withdrawal Engine
        Obligation closes as Withdrawn.
        ThePotLite handles zero funds - confirmed payments remain recorded.
        """
        self.state = 'Withdrawn'
        self.save(update_fields=['state', 'last_activity_at'])
        return True


class ObligationVersionStatus(models.TextChoices):
    PROPOSED = 'proposed', 'Proposed'
    ACTIVE = 'active', 'Active'
    SUPERSEDED = 'superseded', 'Superseded'
    DECLINED = 'declined', 'Declined'


class ObligationVersion(models.Model):
    """
    Versioned Consent Gate:
    No obligation amount changes silently. Affected member must accept a new version before it replaces the active version.
    """
    obligation = models.ForeignKey(Obligation, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    proposed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='proposed_obligation_versions')
    reason = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=ObligationVersionStatus.choices, default=ObligationVersionStatus.PROPOSED)
    created_at = models.DateTimeField(auto_now_add=True)
    consented_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('obligation', 'version_number')
        ordering = ['version_number']

    def consent(self, user):
        """
        Member explicitly consents to proposed version.
        Marks previous active version as superseded and sets this version as active.
        """
        # Mark previous active version as superseded
        ObligationVersion.objects.filter(obligation=self.obligation, status=ObligationVersionStatus.ACTIVE).update(status=ObligationVersionStatus.SUPERSEDED)

        from django.utils import timezone
        self.status = ObligationVersionStatus.ACTIVE
        self.consented_at = timezone.now()
        self.save(update_fields=['status', 'consented_at'])

        # Update obligation amount
        self.obligation.active_version = self.version_number
        self.obligation.total_amount = self.amount
        self.obligation.balance_remaining = self.amount
        self.obligation.save(update_fields=['active_version', 'total_amount', 'balance_remaining', 'last_activity_at'])


class RecordedPaymentMethod(models.TextChoices):
    CASH = 'cash', 'Cash'
    CASH_APP = 'cash_app', 'Cash App'
    ZELLE = 'zelle', 'Zelle'
    VENMO = 'venmo', 'Venmo'
    CHECK = 'check', 'Check'
    OTHER = 'other', 'Other'


class PaymentRecordState(models.TextChoices):
    PENDING_CONFIRMATION = 'Pending_Confirmation', 'Pending Confirmation'
    CONFIRMED = 'Confirmed', 'Confirmed'
    DISPUTED = 'Disputed', 'Disputed'


class PaymentRecord(models.Model):
    """
    Two-Party Payment Confirmation Engine:
    Member files statement that they paid off-platform.
    Organizer confirms or disputes receipt.
    Strict Separation of Duties: Nobody confirms their own payment.
    """
    obligation = models.ForeignKey(Obligation, on_delete=models.CASCADE, related_name='payment_records')
    pot = models.ForeignKey(Pot, on_delete=models.CASCADE, related_name='payments')
    payer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='filed_payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    recorded_method = models.CharField(max_length=30, choices=RecordedPaymentMethod.choices, default=RecordedPaymentMethod.ZELLE)
    member_statement_filed_at = models.DateTimeField(auto_now_add=True)
    confirmed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='confirmed_payments')
    confirmed_at = models.DateTimeField(null=True, blank=True)
    state = models.CharField(max_length=30, choices=PaymentRecordState.choices, default=PaymentRecordState.PENDING_CONFIRMATION)
    notes = models.TextField(blank=True, default='')

    def confirm(self, organizer_user):
        # Strict Rule: Nobody approves their own action / confirms their own payment
        if organizer_user.id == self.payer.id:
            raise ValueError("Anti-Self-Approval: Payer member cannot self-confirm their own payment statement.")

        from django.utils import timezone
        self.confirmed_by = organizer_user
        self.confirmed_at = timezone.now()
        self.state = PaymentRecordState.CONFIRMED
        self.save(update_fields=['confirmed_by', 'confirmed_at', 'state'])

        # Update obligation balance
        self.obligation.balance_remaining = max(0, self.obligation.balance_remaining - self.amount)
        if self.obligation.balance_remaining <= 0:
            self.obligation.state = ObligationState.CONFIRMED
        self.obligation.save(update_fields=['balance_remaining', 'state', 'last_activity_at'])

        # Trigger potential Pot auto-completion
        self.pot.check_auto_completion()
        return True

    def dispute(self, disputer_user, counter_statement: str = ''):
        """
        Phase 4: Dual-Confirmation Payment Recording & Neutral Dispute Engine
        Both statements logged neutrally in audit trail.
        'ThePotLite never decides who is right.'
        """
        from django.utils import timezone
        self.state = PaymentRecordState.DISPUTED
        self.notes = f"{self.notes}\n[Disputed by {disputer_user.username if disputer_user else 'Organizer'}]: {counter_statement}".strip()
        self.save(update_fields=['state', 'notes'])

        self.obligation.state = ObligationState.DISPUTED
        self.obligation.save(update_fields=['state', 'last_activity_at'])
        return True
