from rest_framework import serializers
from .models import AssistanceRequest, RepaymentAgreement


class RepaymentAgreementSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepaymentAgreement
        fields = '__all__'


class AssistanceRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.SerializerMethodField()
    obligation_amount = serializers.SerializerMethodField()
    repayments = RepaymentAgreementSerializer(many=True, read_only=True)

    class Meta:
        model = AssistanceRequest
        fields = [
            'id',
            'obligation',
            'requested_by',
            'requested_by_name',
            'obligation_amount',
            'requested_amount',
            'reason',
            'status',
            'private_note',
            'sponsor',
            'repayments',
            'created_at',
            'updated_at',
        ]

    def get_requested_by_name(self, obj) -> str:
        return obj.requested_by.get_full_name() or obj.requested_by.username

    def get_obligation_amount(self, obj) -> str:
        return str(obj.obligation.total_amount)

