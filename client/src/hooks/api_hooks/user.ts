import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import { User } from "@/lib/api/user";

export function useGetMe() {
    return useQuery({
        queryKey: ["get-me"],
        queryFn: () => api.user.getMe(),
        select: (res) => res.data as ApiRes<User>,
    });
}
