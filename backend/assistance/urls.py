from django.urls import path
from .views import AssistanceListCreateView, AssistanceApproveView

urlpatterns = [
    path('', AssistanceListCreateView.as_view(), name='assistance-list-create'),
    path('<int:pk>/approve', AssistanceApproveView.as_view(), name='assistance-approve'),
    path('<int:pk>/approve/', AssistanceApproveView.as_view(), name='assistance-approve-slash'),
]

