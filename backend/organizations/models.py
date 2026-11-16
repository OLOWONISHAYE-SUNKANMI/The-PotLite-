from django.db import models
from django.conf import settings


class Organization(models.Model):
    name = models.CharField(max_length=200)
    sport = models.CharField(max_length=100, default='Soccer')
    logo_url = models.URLField(max_length=500, blank=True, null=True)
    active_rule_version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Team(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=150)
    age_group = models.CharField(max_length=50, default='U12')
    season = models.CharField(max_length=100, default='Fall 2026')
    coach = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='coached_teams')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.age_group}) - {self.organization.name}"


class Player(models.Model):
    """
    COPPA Child Data Safety Compliance:
    Minors do NOT hold accounts, login credentials, or direct messaging.
    Stored strictly as first_name and single last_initial under their parent's account.
    """
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='players')
    parent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='children_players')
    first_name = models.CharField(max_length=80)
    last_initial = models.CharField(max_length=2)
    jersey_number = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_initial}. ({self.team.name})"


class OrgRulesV1(models.Model):
    """
    Human Rules Engine Defaults as mandated by ThePotLite V1 Specification:
    Grace period: 2 days
    Confirmation window: 48 hours
    Final notice window: 12 hours
    Invite expiry: 72 hours
    Payout 2 approvers threshold: $250
    Payout group vote threshold: $1,000
    """
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='rules')
    version = models.IntegerField(default=1)
    grace_period_days = models.IntegerField(default=2)
    payment_confirmation_window_hours = models.IntegerField(default=48)
    final_notice_window_hours = models.IntegerField(default=12)
    invite_expiry_hours = models.IntegerField(default=72)
    payout_dual_approval_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=250.00)
    payout_group_vote_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('organization', 'version')

    def __str__(self):
        return f"{self.organization.name} Rules v{self.version}"
