from django.db import models
from django.conf import settings


class AuditEvent(models.Model):
    """
    Append-Only Audit Ledger:
    Immutable timeline of all state transitions and human actions.
    No record can be edited or deleted.
    """
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_actions')
    actor_role = models.CharField(max_length=50, default='System')
    action = models.CharField(max_length=100)
    object_type = models.CharField(max_length=50)
    object_id = models.IntegerField(null=True, blank=True)
    plain_text_timeline_entry = models.TextField()
    metadata_snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.plain_text_timeline_entry}"

    @classmethod
    def log(cls, action: str, plain_text: str, actor=None, actor_role='Organizer', object_type='Pot', object_id=None, metadata=None):
        return cls.objects.create(
            actor=actor,
            actor_role=actor_role,
            action=action,
            object_type=object_type,
            object_id=object_id,
            plain_text_timeline_entry=plain_text,
            metadata_snapshot=metadata or {}
        )
