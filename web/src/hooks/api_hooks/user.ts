import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { ApiRes } from "@/lib/api/client";
import { UserMeResponse } from "@/lib/api/user";

export function useMe() {
    return useQuery({
        queryKey: ["useMe"],
        queryFn: () => api.user.me(),
        select: (res) => res.data as ApiRes<UserMeResponse>,
    });
}
