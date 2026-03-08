"""URL routing for ticket endpoints."""

from django.urls import path

from .views import (
    MyTicketsView,
    TicketAdmitView,
    TicketDetailView,
    TicketPurchaseView,
    TicketValidateView,
)

urlpatterns = [
    path("my/", MyTicketsView.as_view(), name="my_tickets"),
    path("validate/", TicketValidateView.as_view(), name="ticket_validate"),
    path("admit/", TicketAdmitView.as_view(), name="ticket_admit"),
    path("<int:pk>/", TicketDetailView.as_view(), name="ticket_detail"),
    path(
        "events/<int:event_id>/", TicketPurchaseView.as_view(), name="ticket_purchase"
    ),
]
