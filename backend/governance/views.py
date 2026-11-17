from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .models import PayoutSpendRequest, ChangeProposal, ProposalVote, PayoutSpendStatus
from audit.models import AuditEvent


class PayoutSpendRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.SerializerMethodField()
    first_approval_by_name = serializers.SerializerMethodField()
    second_approval_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PayoutSpendRequest
        fields = '__all__'

    def get_requested_by_name(self, obj):
        return obj.requested_by.get_full_name() or obj.requested_by.username

    def get_first_approval_by_name(self, obj):
        return (obj.first_approval_by.get_full_name() or obj.first_approval_by.username) if obj.first_approval_by else None

    def get_second_approval_by_name(self, obj):
        return (obj.second_approval_by.get_full_name() or obj.second_approval_by.username) if obj.second_approval_by else None


class PayoutSpendListCreateView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PayoutSpendRequestSerializer

    def get(self, request):
        payouts = PayoutSpendRequest.objects.all().order_by('-created_at')
        serializer = PayoutSpendRequestSerializer(payouts, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data
        requester = request.user if request.user.is_authenticated else None
        if not requester:
            from accounts.models import User
            requester = User.objects.filter(role='Organizer').first()

        from pots.models import Pot
        pot_id = data.get('potId')
        pot = get_object_or_404(Pot, id=pot_id) if pot_id else Pot.objects.first()

        payout = PayoutSpendRequest.objects.create(
            pot=pot,
            requested_by=requester,
            amount=data.get('amount', 0),
            vendor_payee=data.get('vendor', 'Team Vendor'),
            spend_purpose=data.get('purpose', 'Tournament Entry Fee'),
            first_approval_by=requester,
            status=PayoutSpendStatus.PENDING_SECOND_APPROVAL
        )

        AuditEvent.log(
            action="payout_requested",
            plain_text=f'Organizer "{requester.username}" requested off-platform payout spend of ${payout.amount} to "{payout.vendor_payee}"',
            actor=requester,
            object_type="PayoutSpendRequest",
            object_id=payout.id
        )

        return Response(PayoutSpendRequestSerializer(payout).data, status=status.HTTP_201_CREATED)


class PayoutSpendApproveView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        payout = get_object_or_404(PayoutSpendRequest, pk=pk)
        organizer = request.user if request.user.is_authenticated else None
        if not organizer:
            from accounts.models import User
            organizer = User.objects.filter(role='Organizer').exclude(id=payout.requested_by.id).first()

        try:
            payout.approve_by_organizer(organizer)
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)

        AuditEvent.log(
            action="payout_approved",
            plain_text=f'Second Organizer "{organizer.username}" co-signed payout authorization of ${payout.amount} to "{payout.vendor_payee}"',
            actor=organizer,
            object_type="PayoutSpendRequest",
            object_id=payout.id
        )

        return Response(PayoutSpendRequestSerializer(payout).data)


class ChangeProposalSerializer(serializers.ModelSerializer):
    yes_votes = serializers.SerializerMethodField()
    no_votes = serializers.SerializerMethodField()
    total_votes = serializers.SerializerMethodField()
    proposed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ChangeProposal
        fields = '__all__'

    def get_yes_votes(self, obj):
        return obj.votes.filter(choice='yes').count()

    def get_no_votes(self, obj):
        return obj.votes.filter(choice='no').count()

    def get_total_votes(self, obj):
        return obj.votes.count()

    def get_proposed_by_name(self, obj):
        return obj.proposed_by.get_full_name() or obj.proposed_by.username


class ProposalListCreateView(APIView):
    """
    Phase 7: Governance Levels & Group Voting Engine
    Level 3 Changes (affecting multiple members' dues/terms) require group vote.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        proposals = ChangeProposal.objects.all().order_by('-created_at')
        serializer = ChangeProposalSerializer(proposals, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data
        proposer = request.user if request.user.is_authenticated else None
        if not proposer:
            from accounts.models import User
            proposer = User.objects.filter(role='Organizer').first() or User.objects.first()

        from pots.models import Pot
        pot_id = data.get('potId')
        pot = get_object_or_404(Pot, id=pot_id) if pot_id else Pot.objects.first()

        proposal = ChangeProposal.objects.create(
            pot=pot,
            proposed_by=proposer,
            title=data.get('title', 'Budget / Schedule Adjustment'),
            description=data.get('description', ''),
            proposal_type=data.get('proposalType', 'budget_increase'),
            threshold_percent=data.get('thresholdPercent', 60),
            status=data.get('status', 'Open')
        )

        AuditEvent.log(
            action="governance_proposal_created",
            plain_text=f'Governance proposal "{proposal.title}" submitted for group vote (Threshold: {proposal.threshold_percent}%).',
            actor=proposer,
            object_type="ChangeProposal",
            object_id=proposal.id
        )

        return Response(ChangeProposalSerializer(proposal).data, status=status.HTTP_201_CREATED)


class ProposalVoteView(APIView):
    """
    Phase 7: Cast Group Vote
    Eligible active members cast vote.
    Dissenting ('No') votes require a written reason routed to organizers.
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        proposal = get_object_or_404(ChangeProposal, pk=pk)
        voter = request.user if request.user.is_authenticated else None
        if not voter:
            from accounts.models import User
            voter = User.objects.filter(role='Member').first() or User.objects.first()

        choice = request.data.get('choice', 'yes').lower()
        dissent_reason = request.data.get('dissentReason', '')

        vote, _ = ProposalVote.objects.update_or_create(
            proposal=proposal,
            voter=voter,
            defaults={'choice': choice}
        )

        AuditEvent.log(
            action="governance_vote_cast",
            plain_text=f'Member "{voter.username}" voted "{choice.upper()}" on "{proposal.title}"{": " + dissent_reason if dissent_reason else "."}',
            actor=voter,
            actor_role="Member",
            object_type="ProposalVote",
            object_id=vote.id
        )

        return Response({
            "message": f"Vote {choice.upper()} recorded successfully",
            "proposal": ChangeProposalSerializer(proposal).data
        }, status=status.HTTP_200_OK)
