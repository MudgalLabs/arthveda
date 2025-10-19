import { API_ROUTES } from "@/lib/api/api_routes";
import { client, ApiRes } from "@/lib/api/client";

export interface Tag {
    id: string;
    group_id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface TagGroup {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string | null;
    tags: Tag[];
}

export interface TagGroupWithTags extends TagGroup {
    tags: Tag[];
}

export interface ListTagGroupsResponse {
    tag_groups: TagGroupWithTags[];
}

export interface CreateTagGroupResponse {
    tag_group: TagGroupWithTags;
}

export interface CreateTagResponse {
    tag: Tag;
}

// API functions
export function listTagGroups() {
    return client.get<ApiRes<ListTagGroupsResponse>>(API_ROUTES.tag.list);
}

export interface CreateTagGroupRequest {
    name: string;
    description?: string | null;
}

export function createTagGroup(body: CreateTagGroupRequest) {
    return client.post<ApiRes<CreateTagGroupResponse>>(API_ROUTES.tag.createGroup, body);
}

export interface CreateTagRequest {
    group_id: string;
    name: string;
    description?: string | null;
}

export function createTag(body: CreateTagRequest) {
    return client.post<ApiRes<CreateTagResponse>>(API_ROUTES.tag.createTag, body);
}
