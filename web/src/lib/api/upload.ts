import { API_ROUTES } from "@/lib/api/api_routes";
import { ApiRes, client } from "@/lib/api/client";

export const enum UploadResourceType {
    JournalEntry = "journal_entry",
}

export interface UploadPresignPayload {
    resource_type: string;
    resource_id: string | null;
    file_name: string;
    mime_type: string;
    size_bytes: number;
}

export interface UploadPresignResponse {
    upload_id: string;
    upload_url: string;
    download_url: string;
}

export function getUploadPresign(body: UploadPresignPayload) {
    return client.post<ApiRes<UploadPresignResponse>>(API_ROUTES.upload.presign, body);
}
