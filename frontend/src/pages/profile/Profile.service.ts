import client from '@/api/client';

export const ProfileService = {
    getProfile: async () => {
        const res = await client.get('/auth/me/');
        return res.data;
    },
    updateProfile: async (data: any) => {
        const res = await client.patch('/auth/me/', data);
        return res.data;
    }
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
