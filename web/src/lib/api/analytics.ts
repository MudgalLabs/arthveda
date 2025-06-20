import { createApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/api_routes";

// The `client` in the `@/lib/api/client` is the main API client used for making requests.
// This client will call the demo API if the `ARTHVEDA_ENABLE_DEMO` environment variable is set to "true".
// But for analytics, we always use the main API URL.
const analyticsClient = createApiClient(import.meta.env.ARTHVEDA_API_URL);

export interface StartDemoRequest {
    email: string;
}

export interface StartDemoResponse {
    start_email: string;
    start_count: number;
}

export async function startDemo(payload: StartDemoRequest): Promise<StartDemoResponse> {
    const response = await analyticsClient.post<StartDemoResponse>(API_ROUTES.analytics.startDemo, payload);
    return response.data;
}
