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

        target_amount = data.get('total_target_amount') or data.get('goalAmount') or data.get('goalAmountCents') or 0.00
        if isinstance(target_amount, str):
            try:
                target_amount = float(target_amount.replace('$', '').replace(',', ''))
            except ValueError:
                target_amount = 0.00

        per_member = data.get('per_member_amount') or data.get('perMemberAmount') or 0.00
        if isinstance(per_member, str):
            try:
                per_member = float(per_member.replace('$', '').replace(',', ''))
            except ValueError:
                per_member = 0.00

        pot_type = data.get('pot_type') or data.get('potType') or 'season fee'
        due_date = data.get('due_date') or data.get('deadline') or None
        if isinstance(due_date, str) and 'T' in due_date:
            due_date = due_date.split('T')[0]

        pot = Pot.objects.create(
            organization=org,
            team=team,
            creator=creator,
            name=data.get('name', 'Season Dues'),
            description=data.get('description', ''),
            pot_type=pot_type,
            total_target_amount=target_amount,
            per_member_amount=per_member,
            due_date=due_date
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


class PaymentRecordListView(APIView):
    """
    List payment records with optional filtering by status
    """
    permission_classes = [AllowAny]
    serializer_class = PaymentRecordSerializer

    def get(self, request):
        status_filter = request.query_params.get('state') or request.query_params.get('status')
        qs = PaymentRecord.objects.all().order_by('-member_statement_filed_at')
        if status_filter:
            qs = qs.filter(state__iexact=status_filter)
        serializer = PaymentRecordSerializer(qs, many=True)
        return Response(serializer.data)


class DashboardOrganizerView(APIView):
    """
    Live aggregated organizer dashboard API
    """
    permission_classes = [AllowAny]

    def get(self, request):
        pots = Pot.objects.all().order_by('-created_at')
        total_goal = sum([float(p.total_target_amount) for p in pots])
        total_confirmed = 0.0
        for p in pots:
            for ob in p.obligations.all():
                total_confirmed += float(ob.total_amount - ob.balance_remaining)

        pending_payments = PaymentRecord.objects.filter(state=PaymentRecordState.PENDING_CONFIRMATION).order_by('-member_statement_filed_at')
        from governance.models import PayoutSpendRequest, PayoutSpendStatus
        pending_payouts = PayoutSpendRequest.objects.filter(status=PayoutSpendStatus.PENDING_SECOND_APPROVAL).order_by('-created_at')
        from assistance.models import AssistanceRequest, AssistanceStatus
        pending_assistance = AssistanceRequest.objects.filter(status=AssistanceStatus.PENDING).order_by('-created_at')
        disputes = PaymentRecord.objects.filter(state=PaymentRecordState.DISPUTED)

        from governance.views import PayoutSpendRequestSerializer
        from assistance.serializers import AssistanceRequestSerializer

        return Response({
            "pots": PotSerializer(pots, many=True).data,
            "totalConfirmed": total_confirmed,
            "totalGoal": total_goal,
            "collectionRate": round((total_confirmed / total_goal * 100) if total_goal > 0 else 0, 1),
            "pendingConfirmations": PaymentRecordSerializer(pending_payments, many=True).data,
            "pendingPayouts": PayoutSpendRequestSerializer(pending_payouts, many=True).data,
            "pendingAssistance": AssistanceRequestSerializer(pending_assistance, many=True).data,
            "disputes": PaymentRecordSerializer(disputes, many=True).data,
        })


class DashboardMemberView(APIView):
    """
    Live aggregated member dashboard API
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        user_id = request.query_params.get('userId')
        if not user and user_id:
            from accounts.models import User
            try:
                user = User.objects.filter(id=int(user_id)).first()
            except (ValueError, TypeError):
                pass

        if user:
            obligations = Obligation.objects.filter(member=user).order_by('-created_at')
        else:
            obligations = Obligation.objects.filter(member__role='Member').order_by('-created_at')

        total_committed = sum([float(o.total_amount) for o in obligations])
        total_remaining = sum([float(o.balance_remaining) for o in obligations])
        total_paid = max(0.0, total_committed - total_remaining)

        from governance.models import ChangeProposal, ProposalStatus
        proposals = ChangeProposal.objects.filter(status=ProposalStatus.OPEN).order_by('-created_at')
        from governance.views import ChangeProposalSerializer

        payments = PaymentRecord.objects.filter(obligation__in=obligations).order_by('-member_statement_filed_at')[:10]

        return Response({
            "obligations": ObligationSerializer(obligations, many=True).data,
            "totalCommitted": total_committed,
            "totalRemaining": total_remaining,
            "totalPaid": total_paid,
            "proposals": ChangeProposalSerializer(proposals, many=True).data,
            "recentPayments": PaymentRecordSerializer(payments, many=True).data,
        })



class ObligationWithdrawView(APIView):
    """
    Phase 3: Opt-Out / Withdrawal Flow
    Closes obligation as Withdrawn and records audit event.
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        obligation = get_object_or_404(Obligation, pk=pk)
        reason = request.data.get('reason', 'Member withdrew')
        obligation.withdraw(reason=reason)

        AuditEvent.log(
            action="obligation_withdrawn",
            plain_text=f'Member "{obligation.member.username}" withdrew from Pot "{obligation.pot.name}". Reason: {reason}',
            actor=obligation.member,
            actor_role="Member",
            object_type="Obligation",
            object_id=obligation.id
        )

        return Response(ObligationSerializer(obligation).data, status=status.HTTP_200_OK)


class PaymentRecordDisputeView(APIView):
    """
    Phase 4: Neutral Dispute Engine
    Sets payment to Disputed and logs both statements side-by-side.
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        record = get_object_or_404(PaymentRecord, pk=pk)
        disputer = request.user if request.user.is_authenticated else None
        if not disputer:
            from accounts.models import User
            disputer = User.objects.filter(role='Organizer').first()

        statement = request.data.get('statement', 'Amount or receipt mismatch reported by organizer')
        record.dispute(disputer, counter_statement=statement)

        AuditEvent.log(
            action="payment_disputed",
            plain_text=f'Discrepancy logged for payment #${record.id} (${record.amount}): "{statement}". Both statements filed neutrally.',
            actor=disputer,
            actor_role="Organizer",
            object_type="PaymentRecord",
            object_id=record.id
        )

        return Response(PaymentRecordSerializer(record).data, status=status.HTTP_200_OK)


