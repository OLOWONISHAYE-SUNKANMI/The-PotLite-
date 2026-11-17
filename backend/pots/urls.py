from django.urls import path
from .views import (
    PotListCreateView,
    PotDetailView,
    ObligationAcceptView,
    ObligationWithdrawView,
    ObligationRecordPaymentView,
    ObligationConfirmPaymentView,
    PaymentRecordDisputeView,
)

urlpatterns = [
    path('', PotListCreateView.as_view(), name='pots-list-create'),
    path('<int:pk>', PotDetailView.as_view(), name='pots-detail'),
    path('<int:pk>/', PotDetailView.as_view(), name='pots-detail-slash'),
    path('obligations/<int:pk>/accept', ObligationAcceptView.as_view(), name='obligation-accept'),
    path('obligations/<int:pk>/accept/', ObligationAcceptView.as_view(), name='obligation-accept-slash'),
    path('obligations/<int:pk>/withdraw', ObligationWithdrawView.as_view(), name='obligation-withdraw'),
    path('obligations/<int:pk>/withdraw/', ObligationWithdrawView.as_view(), name='obligation-withdraw-slash'),
    path('obligations/<int:pk>/pay', ObligationRecordPaymentView.as_view(), name='obligation-pay'),
    path('obligations/<int:pk>/pay/', ObligationRecordPaymentView.as_view(), name='obligation-pay-slash'),
    path('payments/<int:pk>/confirm', ObligationConfirmPaymentView.as_view(), name='payment-confirm'),
    path('payments/<int:pk>/confirm/', ObligationConfirmPaymentView.as_view(), name='payment-confirm-slash'),
    path('payments/<int:pk>/dispute', PaymentRecordDisputeView.as_view(), name='payment-dispute'),
    path('payments/<int:pk>/dispute/', PaymentRecordDisputeView.as_view(), name='payment-dispute-slash'),
]

