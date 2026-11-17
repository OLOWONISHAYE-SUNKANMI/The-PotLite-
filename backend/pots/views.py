from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .models import Pot, Obligation, ObligationVersion, PaymentRecord, ObligationState, PaymentRecordState
from .serializers import PotSerializer, ObligationSerializer, PaymentRecordSerializer
from organizations.models import Organization, Team
from audit.models import AuditEvent


class PotListCreateView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PotSerializer

    def get(self, request):
        pots = Pot.objects.all().order_by('-created_at')
        serializer = PotSerializer(pots, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data
        creator = request.user if request.user.is_authenticated else None
        if not creator:
            from accounts.models import User
            creator = User.objects.filter(role='Organizer').first() or User.objects.first()

        org = Organization.objects.first()
        if not org:
            org = Organization.objects.create(name="Tigers Youth Soccer Club", sport="Soccer")

        team = Team.objects.first()
        if not team:
            team = Team.objects.create(organization=org, name="U12 Tigers", coach=creator)

        pot = Pot.objects.create(
            organization=org,
            team=team,
            creator=creator,
            name=data.get('name', 'Season Dues'),
            description=data.get('description', ''),
            pot_type=data.get('pot_type', 'season fee'),
            total_target_amount=data.get('total_target_amount', 0.00),
            per_member_amount=data.get('per_member_amount', 0.00),
            due_date=data.get('due_date') or None
        )

        AuditEvent.log(
            action="pot_created",
            plain_text=f'Organizer {creator.username if creator else "Admin"} created Pot "{pot.name}" with target ${pot.total_target_amount}',
            actor=creator,
            object_type="Pot",
            object_id=pot.id
        )

        return Response(PotSerializer(pot).data, status=status.HTTP_201_CREATED)


class PotDetailView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PotSerializer

    def get(self, request, pk):
        pot = get_object_or_404(Pot, pk=pk)
        return Response(PotSerializer(pot).data)


class ObligationAcceptView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        obligation = get_object_or_404(Obligation, pk=pk)
        success = obligation.accept_invite()
        if not success:
            return Response({"error": "Obligation could not be accepted in current state."}, status=status.HTTP_400_BAD_REQUEST)

        AuditEvent.log(
            action="obligation_accepted",
            plain_text=f'Member "{obligation.member.username}" accepted obligation terms for Pot "{obligation.pot.name}"',
            actor=obligation.member,
            actor_role="Member",
            object_type="Obligation",
            object_id=obligation.id
        )
        return Response(ObligationSerializer(obligation).data)


class ObligationRecordPaymentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        obligation = get_object_or_404(Obligation, pk=pk)
        amount = request.data.get('amount')
        method = request.data.get('method', 'zelle')
        notes = request.data.get('notes', '')

        if not amount:
            return Response({"error": "Payment amount required."}, status=status.HTTP_400_BAD_REQUEST)

        payer = request.user if request.user.is_authenticated else obligation.member

        record = PaymentRecord.objects.create(
            obligation=obligation,
            pot=obligation.pot,
            payer=payer,
            amount=amount,
            recorded_method=method,
            notes=notes,
            state=PaymentRecordState.PENDING_CONFIRMATION
        )

        obligation.state = ObligationState.STATEMENT_FILED
        obligation.save(update_fields=['state', 'last_activity_at'])

        AuditEvent.log(
            action="payment_statement_filed",
            plain_text=f'Member "{payer.username}" recorded off-platform payment of ${amount} via {method}',
            actor=payer,
            actor_role="Member",
            object_type="PaymentRecord",
            object_id=record.id
        )

        return Response(PaymentRecordSerializer(record).data, status=status.HTTP_201_CREATED)


class ObligationConfirmPaymentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        record = get_object_or_404(PaymentRecord, pk=pk)
        organizer = request.user if request.user.is_authenticated else None
        if not organizer:
            from accounts.models import User
            organizer = User.objects.filter(role='Organizer').first()

        try:
            record.confirm(organizer)
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)

        AuditEvent.log(
            action="payment_confirmed",
            plain_text=f'Organizer "{organizer.username if organizer else "Coach"}" verified receipt of ${record.amount} for member "{record.payer.username}"',
            actor=organizer,
            actor_role="Organizer",
            object_type="PaymentRecord",
            object_id=record.id
        )

        return Response(PaymentRecordSerializer(record).data, status=status.HTTP_200_OK)
