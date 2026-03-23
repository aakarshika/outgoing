import client from '@/api/client';

/**
 * Public showcase GET returns `{ success, message, data: profile, meta }`.
 * Some callers may already hold the inner `data` object — accept both shapes.
 */
export function unwrapPublicProfileResponse(body: unknown): unknown {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  if (typeof o.username === 'string') return body;
  const inner = o.data;
  if (
    inner &&
    typeof inner === 'object' &&
    typeof (inner as Record<string, unknown>).username === 'string'
  ) {
    return inner;
  }
  return null;
}

export const ProfileService = {
  getProfile: async () => {
    const res = await client.get('/auth/me/');
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await client.patch('/auth/me/', data);
    return res.data;
  },
  getPublicProfile: async (username: string) => {
    const res = await client.get(`/profiles/${username}/`);
    return res.data;
  },
  getPublicProfileByUserId: async (userId: number) => {
    const res = await client.get(`/profiles/by-id/${userId}/`);
    return res.data;
  },
};

export const MetaService = {
  getMetadata: async () => {
    const res = await client.get('/profiles/metadata/');
    return res.data.data;
  },
  updateMetadata: async (data: any) => {
    const res = await client.patch('/profiles/metadata/', data);
    return res.data.data;
  },
  generateAiOutput: async (userId?: number) => {
    const res = await client.post('/profiles/generate/', {
      // Backend defaults to the authenticated user if user_id is not sent.
      ...(userId ? { user_id: userId } : {}),
    });
    // Envelope: { success, message, data: { ai_output }, meta }
    return res.data.data.ai_output as string;
  },
};
