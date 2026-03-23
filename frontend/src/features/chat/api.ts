import client from '@/api/client';
import type { ApiResponse } from '@/types/api';

export interface ChatMessageDto {
  id: number;
  sender_id: number;
  sender_username: string;
  sender_avatar: string | null;
  thread_key: string;
  body: string;
  created_at: string;
}

export interface ChatPeerUserDto {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
}

export interface ChatEventMiniDto {
  id: number;
  title: string;
}

export interface ConversationItemDto {
  thread_key: string;
  updated_at: string;
  last_message: ChatMessageDto | null;
  peer_user: ChatPeerUserDto | null;
  event: ChatEventMiniDto | null;
}

export interface MessagesListMeta {
  page: number;
  page_size: number;
  total_count: number;
}

/** Phase 2 — non-message timeline row from GET /chat/thread-insights/ */
export interface ThreadInsightDto {
  id: string;
  type: string;
  occurred_at: string;
  label: string;
  detail?: string | null;
  event_id?: number | null;
  event_title?: string | null;
}

export const chatApi = {
  listConversations: async (): Promise<ApiResponse<ConversationItemDto[]>> => {
    const res = await client.get('/chat/conversations/');
    return res.data;
  },

  listMessages: async (
    threadKey: string,
    params?: { page?: number; page_size?: number },
  ): Promise<ApiResponse<ChatMessageDto[]>> => {
    const res = await client.get('/chat/messages/', {
      params: { thread_key: threadKey, ...params },
    });
    return res.data;
  },

  postMessage: async (
    threadKey: string,
    body: string,
  ): Promise<ApiResponse<ChatMessageDto>> => {
    const res = await client.post('/chat/messages/', { thread_key: threadKey, body });
    return res.data;
  },

  listThreadInsights: async (
    threadKey: string,
  ): Promise<ApiResponse<ThreadInsightDto[]>> => {
    const res = await client.get('/chat/thread-insights/', {
      params: { thread_key: threadKey },
    });
    return res.data;
  },
};
