import { client } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/api_routes";

export interface StartDemoRequest {
    email: string;
}

export interface StartDemoResponse {
    start_email: string;
    start_count: number;
}

export const analytics = {
    startDemo: async (payload: StartDemoRequest): Promise<StartDemoResponse> => {
        const response = await client.post<StartDemoResponse>(API_ROUTES.analytics.startDemo, payload);
        return response.data;
    },
};
