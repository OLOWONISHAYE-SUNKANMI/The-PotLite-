from rest_framework import serializers
from .models import Pot, Obligation, ObligationVersion, PaymentRecord
from organizations.models import Organization, Team, Player


class ObligationVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObligationVersion
        fields = '__all__'


class PaymentRecordSerializer(serializers.ModelSerializer):
    payerName = serializers.SerializerMethodField()
    confirmedByName = serializers.SerializerMethodField()

    class Meta:
        model = PaymentRecord
        fields = [
            'id',
            'amount',
            'recorded_method',
            'state',
            'member_statement_filed_at',
            'confirmed_at',
            'notes',
            'payerName',
            'confirmedByName',
        ]

    def get_payerName(self, obj):
        return obj.payer.get_full_name() or obj.payer.username

    def get_confirmedByName(self, obj):
        return (obj.confirmed_by.get_full_name() or obj.confirmed_by.username) if obj.confirmed_by else None


class ObligationSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    player_name = serializers.SerializerMethodField()
    versions = ObligationVersionSerializer(many=True, read_only=True)
    payments = PaymentRecordSerializer(source='payment_records', many=True, read_only=True)

    class Meta:
        model = Obligation
        fields = [
            'id',
            'pot',
            'member',
            'member_name',
            'player',
            'player_name',
            'state',
            'active_version',
            'total_amount',
            'balance_remaining',
            'last_activity_at',
            'created_at',
            'versions',
            'payments',
        ]

    def get_member_name(self, obj):
        return obj.member.get_full_name() or obj.member.username

    def get_player_name(self, obj):
        return f"{obj.player.first_name} {obj.player.last_initial}." if obj.player else None


class PotSerializer(serializers.ModelSerializer):
    obligations = ObligationSerializer(many=True, read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    collected_amount = serializers.SerializerMethodField()

    class Meta:
        model = Pot
        fields = [
            'id',
            'name',
            'description',
            'pot_type',
            'total_target_amount',
            'per_member_amount',
            'status',
            'due_date',
            'organization',
            'organization_name',
            'team',
            'team_name',
            'creator',
            'created_at',
            'collected_amount',
            'obligations',
        ]

    def get_collected_amount(self, obj):
        total_collected = 0.00
        for ob in obj.obligations.all():
            total_collected += float(ob.total_amount - ob.balance_remaining)
        return total_collected

