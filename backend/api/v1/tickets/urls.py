"""URL routing for ticket endpoints."""

from django.urls import path

from .views import MyTicketsView, TicketPurchaseView

urlpatterns = [
    path("my/", MyTicketsView.as_view(), name="my_tickets"),
    path(
        "events/<int:event_id>/", TicketPurchaseView.as_view(), name="ticket_purchase"
    ),
]
