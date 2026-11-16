from django.urls import path
from .views import PayoutSpendListCreateView, PayoutSpendApproveView

urlpatterns = [
    path('payouts', PayoutSpendListCreateView.as_view(), name='governance-payouts-list'),
    path('payouts/', PayoutSpendListCreateView.as_view(), name='governance-payouts-list-slash'),
    path('payouts/<int:pk>/approve', PayoutSpendApproveView.as_view(), name='governance-payouts-approve'),
    path('payouts/<int:pk>/approve/', PayoutSpendApproveView.as_view(), name='governance-payouts-approve-slash'),
]
