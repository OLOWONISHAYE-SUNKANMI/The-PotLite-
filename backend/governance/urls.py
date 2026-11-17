from django.urls import path
from .views import (
    PayoutSpendListCreateView,
    PayoutSpendApproveView,
    ProposalListCreateView,
    ProposalVoteView,
)

urlpatterns = [
    path('payouts', PayoutSpendListCreateView.as_view(), name='governance-payouts-list'),
    path('payouts/', PayoutSpendListCreateView.as_view(), name='governance-payouts-list-slash'),
    path('payouts/<int:pk>/approve', PayoutSpendApproveView.as_view(), name='governance-payouts-approve'),
    path('payouts/<int:pk>/approve/', PayoutSpendApproveView.as_view(), name='governance-payouts-approve-slash'),
    path('proposals', ProposalListCreateView.as_view(), name='governance-proposals-list'),
    path('proposals/', ProposalListCreateView.as_view(), name='governance-proposals-list-slash'),
    path('proposals/<int:pk>/vote', ProposalVoteView.as_view(), name='governance-proposals-vote'),
    path('proposals/<int:pk>/vote/', ProposalVoteView.as_view(), name='governance-proposals-vote-slash'),
]

