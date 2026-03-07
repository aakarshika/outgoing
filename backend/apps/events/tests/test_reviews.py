from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from apps.events.models import (
    Event,
    EventReview,
    EventReviewLike,
    EventReviewComment,
)

User = get_user_model()


class EventReviewTests(APITestCase):
    def setUp(self):
        from django.utils import timezone
        import datetime

        self.host = User.objects.create_user(username="host", password="password", email="host@example.com")
        self.reviewer = User.objects.create_user(username="reviewer", password="password", email="reviewer@example.com")
        self.commenter = User.objects.create_user(username="commenter", password="password", email="commenter@example.com")
        self.event = Event.objects.create(
            host=self.host,
            title="Test Event for Review Likes",
            slug="test-event-review-likes",
            location_name="Online",
            start_time=timezone.now() - datetime.timedelta(days=2),
            end_time=timezone.now() - datetime.timedelta(days=1),
            status="completed",
            lifecycle_state="completed",
        )
        self.review = EventReview.objects.create(
            event=self.event,
            reviewer=self.reviewer,
            rating=5,
            text="Great event!",
        )

    def test_review_like_toggle(self):
        url = reverse("review_like_toggle", kwargs={"review_id": self.review.id})

        # Initially not authenticated
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticate and like
        self.client.force_authenticate(user=self.reviewer)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get("data").get("liked"))
        self.assertTrue(EventReviewLike.objects.filter(review=self.review, user=self.reviewer).exists())

        # Unlike
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data.get("data").get("liked"))
        self.assertFalse(EventReviewLike.objects.filter(review=self.review, user=self.reviewer).exists())

    def test_review_comments(self):
        url = reverse("review_comments", kwargs={"review_id": self.review.id})

        # List comments (empty)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get("data")), 0)

        # Add comment (must be authenticated)
        payload = {"text": "I agree!"}
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticate and add comment
        self.client.force_authenticate(user=self.commenter)
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get("data").get("text"), "I agree!")
        self.assertEqual(EventReviewComment.objects.filter(review=self.review, author=self.commenter).count(), 1)

        # Add a nested comment
        parent_comment_id = response.data.get("data").get("id")
        nested_payload = {"text": "Me too!", "parent": parent_comment_id}
        response = self.client.post(url, nested_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # List comments again, should be hierarchical
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get("data")
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["text"], "I agree!")
        self.assertEqual(len(data[0]["replies"]), 1)
        self.assertEqual(data[0]["replies"][0]["text"], "Me too!")

