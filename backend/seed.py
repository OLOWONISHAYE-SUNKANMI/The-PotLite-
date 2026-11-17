import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'thepot.settings')
django.setup()

from django.contrib.auth import get_user_model
from organizations.models import Organization, Team, Player, OrgRulesV1
from pots.models import Pot, PotType, PotStatus, Obligation, ObligationState, ObligationVersion, ObligationVersionStatus, RecordedPaymentMethod, PaymentRecord
from audit.models import AuditEvent
from decimal import Decimal

User = get_user_model()

def seed():
    print("🌱 Seeding ThePotLite Django database...")

    # 1. Organization
    org, created = Organization.objects.get_or_create(
        id=1,
        defaults={
            'name': 'The Pot Limited Club',
            'sport': 'Youth Soccer',
            'logo_url': '/thepot-logo.png',
            'active_rule_version': 1,
        }
    )
    if created:
        print(f"Created organization: {org.name}")

    # 2. OrgRulesV1
    rules, _ = OrgRulesV1.objects.get_or_create(
        organization=org,
        version=1,
        defaults={
            'grace_period_days': 2,
            'payment_confirmation_window_hours': 48,
            'final_notice_window_hours': 12,
            'invite_expiry_hours': 72,
            'payout_dual_approval_threshold': Decimal('250.00'),
            'payout_group_vote_threshold': Decimal('1000.00'),
        }
    )

    # 3. Users
    coach, c_created = User.objects.get_or_create(
        username='coach_marcus',
        defaults={
            'first_name': 'Marcus',
            'last_name': 'Lewis',
            'email': 'coach.marcus@thepotlite.org',
            'phone': '+15550192834',
            'role': 'Organizer',
            'title': 'Head Coach & Director',
            'two_factor_enabled': False,
        }
    )
    coach.set_password('Password123!')
    coach.save()

    parent, p_created = User.objects.get_or_create(
        username='sarah_j',
        defaults={
            'first_name': 'Sarah',
            'last_name': 'Jenkins',
            'email': 'sarah.jenkins@example.com',
            'phone': '+15550149821',
            'role': 'Member',
            'title': 'Parent of Jordan M.',
            'two_factor_enabled': False,
        }
    )
    parent.set_password('Password123!')
    parent.save()

    # 4. Team
    team, _ = Team.objects.get_or_create(
        id=1,
        defaults={
            'organization': org,
            'name': 'U12 Tigers Soccer Team',
            'age_group': 'U12',
            'season': 'Fall 2026',
            'coach': coach,
        }
    )

    # 5. COPPA-Safe Player
    player, _ = Player.objects.get_or_create(
        team=team,
        parent=parent,
        first_name='Jordan',
        defaults={
            'last_initial': 'M',
            'jersey_number': '10',
        }
    )

    # 6. Pot
    pot, _ = Pot.objects.get_or_create(
        id=1,
        defaults={
            'organization': org,
            'team': team,
            'creator': coach,
            'name': 'Fall 2026 Tournament & Uniform Pot',
            'description': 'Non-custodial obligation tracking for Fall season uniforms, tournament entry fees, and referee fees.',
            'pot_type': PotType.SEASON_FEE,
            'total_target_amount': Decimal('1800.00'),
            'per_member_amount': Decimal('150.00'),
            'status': PotStatus.ACTIVE,
        }
    )

    # 7. Obligation
    ob, _ = Obligation.objects.get_or_create(
        pot=pot,
        member=parent,
        defaults={
            'player': player,
            'total_amount': Decimal('150.00'),
            'balance_remaining': Decimal('150.00'),
            'state': ObligationState.ACCEPTED,
            'active_version': 1,
        }
    )

    ObligationVersion.objects.get_or_create(
        obligation=ob,
        version_number=1,
        defaults={
            'amount': Decimal('150.00'),
            'proposed_by': coach,
            'reason': 'Initial invitation fee',
            'status': ObligationVersionStatus.ACTIVE,
        }
    )

    # 8. Governance: Payout Request & Change Proposal
    from governance.models import PayoutSpendRequest, PayoutSpendStatus, ChangeProposal, ProposalStatus, ProposalType
    payout, _ = PayoutSpendRequest.objects.get_or_create(
        id=1,
        defaults={
            'pot': pot,
            'requested_by': coach,
            'amount': Decimal('450.00'),
            'vendor_payee': 'State Referee Association',
            'spend_purpose': 'State Cup Group Stage Referee & Field Marshals',
            'status': PayoutSpendStatus.PENDING_SECOND_APPROVAL,
            'first_approval_by': coach,
        }
    )

    proposal, _ = ChangeProposal.objects.get_or_create(
        id=1,
        defaults={
            'pot': pot,
            'proposed_by': coach,
            'title': 'Add $25/player for State Cup Referee & Video Analysis',
            'description': 'Covers supplemental referee fees and Veo video camera rental for the regional showcase.',
            'proposal_type': ProposalType.BUDGET_INCREASE,
            'threshold_percent': 60,
            'status': ProposalStatus.OPEN,
        }
    )

    # 9. Audit Event
    AuditEvent.log(
        action='POT_CREATED',
        actor=coach,
        actor_role='Organizer',
        object_type='Pot',
        object_id=pot.id,
        plain_text='Pot initialized with non-custodial rules engine',
        metadata={'target': 1800.0, 'per_member': 150.0}
    )

    print("✅ Database seeding completed successfully!")
    print(f"   Organizer: coach_marcus / Password123!")
    print(f"   Member:    sarah_j      / Password123!")

if __name__ == '__main__':
    seed()
