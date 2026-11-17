from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .models import AssistanceRequest, AssistanceStatus, RepaymentAgreement
from .serializers import AssistanceRequestSerializer
from pots.models import Obligation, ObligationState
from audit.models import AuditEvent


class AssistanceListCreateView(APIView):
    permission_classes = [AllowAny]
    serializer_class = AssistanceRequestSerializer

    def get(self, request):
        # Confidential: If user is member, filter strictly by their requests
        if request.user.is_authenticated and getattr(request.user, 'role', '') == 'Member':
            requests = AssistanceRequest.objects.filter(requested_by=request.user).order_by('-created_at')
        else:
            requests = AssistanceRequest.objects.all().order_by('-created_at')
        serializer = AssistanceRequestSerializer(requests, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data
        user = request.user if request.user.is_authenticated else None
        if not user:
            from accounts.models import User
            user = User.objects.filter(role='Member').first() or User.objects.first()

        obligation_id = data.get('obligationId') or data.get('obligation')
        obligation = get_object_or_404(Obligation, id=obligation_id) if obligation_id else Obligation.objects.first()

        if not obligation:
            return Response({"error": "Obligation not found"}, status=status.HTTP_404_NOT_FOUND)

        req_amount = data.get('requestedAmount') or data.get('requested_amount') or obligation.balance_remaining

        assistance_req = AssistanceRequest.objects.create(
            obligation=obligation,
            requested_by=user,
            requested_amount=req_amount,
            reason=data.get('reason', 'Payment extension request'),
            private_note=data.get('privateNote', '') or data.get('private_note', ''),
            status=AssistanceStatus.PENDING
        )

        obligation.state = ObligationState.ASSISTANCE_PENDING
        obligation.save(update_fields=['state'])

        AuditEvent.log(
            action="assistance_requested",
            plain_text=f"Confidential assistance request filed by {user.username} for obligation #{obligation.id}",
            actor=user,
            object_type="AssistanceRequest",
            object_id=assistance_req.id
        )

        return Response(AssistanceRequestSerializer(assistance_req).data, status=status.HTTP_201_CREATED)


class AssistanceApproveView(APIView):
    permission_classes = [AllowAny]
    serializer_class = AssistanceRequestSerializer

    def post(self, request, pk):
        assistance_req = get_object_or_404(AssistanceRequest, id=pk)
        approver = request.user if request.user.is_authenticated else None
        if not approver:
            from accounts.models import User
            approver = User.objects.filter(role='Organizer').first()

        action = request.data.get('action', 'approve')
        if action == 'deny':
            assistance_req.status = AssistanceStatus.DENIED
            assistance_req.save(update_fields=['status'])
            assistance_req.obligation.state = ObligationState.ACCEPTED
            assistance_req.obligation.save(update_fields=['state'])
            return Response(AssistanceRequestSerializer(assistance_req).data)

        # Approve
        assistance_req.status = AssistanceStatus.APPROVED
        assistance_req.save(update_fields=['status'])

        # Create repayment agreement if installment dates specified
        repayment_days = int(request.data.get('extensionDays', 14))
        from django.utils import timezone
        due_date = timezone.now().date() + timezone.timedelta(days=repayment_days)

        RepaymentAgreement.objects.create(
            assistance_request=assistance_req,
            amount=assistance_req.requested_amount,
            due_date=due_date,
            status="Active"
        )

        assistance_req.obligation.state = ObligationState.ACCEPTED
        assistance_req.obligation.save(update_fields=['state'])

        AuditEvent.log(
            action="assistance_approved",
            plain_text=f"Organizer {approver.username if approver else 'Admin'} approved assistance for {assistance_req.requested_by.username} (extension: {repayment_days} days)",
            actor=approver,
            object_type="AssistanceRequest",
            object_id=assistance_req.id
        )

        return Response(AssistanceRequestSerializer(assistance_req).data)
