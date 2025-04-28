import { useQuery } from "@tanstack/react-query";

import { ApiRes, GetMeResponse } from "@/lib/api/types";
import { api } from "@/lib/api";

export function useGetMe() {
    return useQuery({
        queryKey: ["get-me"],
        queryFn: () => api.user.getMe(),
        select: (res) => res.data as ApiRes<GetMeResponse>,
    });
}
