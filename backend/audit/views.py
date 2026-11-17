from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import AuditEvent
from .serializers import AuditEventSerializer


class AuditTrailView(APIView):
    permission_classes = [AllowAny]
    serializer_class = AuditEventSerializer

    def get(self, request):
        events = AuditEvent.objects.all().order_by('-timestamp')[:100]
        serializer = AuditEventSerializer(events, many=True)
        return Response(serializer.data)
