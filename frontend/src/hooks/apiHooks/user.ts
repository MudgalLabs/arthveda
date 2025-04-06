import { api } from "@/lib/api";
import { GetMeResponseBody } from "@/lib/api/types";
import { useQuery } from "@tanstack/react-query";

export function useGetMe() {
    return useQuery({
        queryKey: ["get-me"],
        queryFn: () => api.user.getMe(),
        select: (res) => res.data as GetMeResponseBody,
    });
}
