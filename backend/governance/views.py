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
