import pytest
from django.urls import reverse
from rest_framework import status

from apps.events.models import Event, EventSeries, EventSeriesNeedTemplate
from apps.events.models import EventCategory

pytestmark = pytest.mark.django_db


def test_generate_occurrences(api_client, user_factory):
    """Test EventSeries occurrence generation with idempotency and need cloning."""

    host = user_factory()
    api_client.force_authenticate(user=host)

    category = EventCategory.objects.create(name="Test Category", slug="test-cat")

    series = EventSeries.objects.create(
        host=host,
        name="Weekly Workshop",
        recurrence_rule="FREQ=WEEKLY;BYDAY=MO",
        default_location_name="Community Center",
        default_capacity=20,
    )

    EventSeriesNeedTemplate.objects.create(
        series=series,
        title="Event Photographer",
        category="Photography",
        criticality="essential",
        budget_min=100.00,
        budget_max=200.00,
    )

    # Generate next 3 occurrences
    url = reverse("event_series_generate", args=[series.id])
    payload = {
        "generate_count": 3,
        "clone_need_templates": True,
        "category_id": category.id,
    }

    response = api_client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED, response.data

    events = Event.objects.filter(series=series).order_by("start_time")
    assert events.count() == 3
    assert events[0].occurrence_index == 1
    assert events[1].occurrence_index == 2
    assert events[2].occurrence_index == 3

    # Check if needs were cloned
    need1 = events[0].needs.first()
    assert need1 is not None
    assert need1.title == "Event Photographer"
    assert need1.budget_max == 200.00

    # Test Idempotency
    # Generating again should not create duplicate events for the same dates
    # But wait, our API just generates the next N occurrences based on RRULE.
    # It loops `dates = rule` and checks `if Event.objects.filter(series=series, start_time=dt).exists(): continue`.
    # Let's call it again with the same parameters
    response = api_client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED

    # Because generate_count is 3, it looks at the first 3 dates of the RRULE.
    # Since they already exist, it will skip them and generate 0 new events.
    # So count should still be 3.
    assert Event.objects.filter(series=series).count() == 3
