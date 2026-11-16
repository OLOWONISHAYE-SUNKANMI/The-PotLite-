from rest_framework import serializers
from .models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    actor_username = serializers.SerializerMethodField()

    class Meta:
        model = AuditEvent
        fields = [
            'id',
            'timestamp',
            'actor_role',
            'action',
            'object_type',
            'object_id',
            'plain_text_timeline_entry',
            'metadata_snapshot',
            'actor_username',
        ]

    def get_actor_username(self, obj):
        return obj.actor.username if obj.actor else 'System'
