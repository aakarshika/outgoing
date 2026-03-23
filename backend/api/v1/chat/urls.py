"""URL routing for chat endpoints."""

from django.urls import path

from .views import ConversationListView, MessageListCreateView, ThreadInsightsListView

urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="chat_conversations"),
    path("thread-insights/", ThreadInsightsListView.as_view(), name="chat_thread_insights"),
    path("messages/", MessageListCreateView.as_view(), name="chat_messages"),
]
