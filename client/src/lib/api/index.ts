import { AxiosError } from "axios";

import { ApiRes } from "@/lib/api/client";
import { toast } from "@/components/toast";
import * as auth from "@/lib/api/auth";
import * as currency from "@/lib/api/currency";
import * as position from "@/lib/api/position";
import * as user from "@/lib/api/user";

export const api = {
    auth,
    currency,
    position,
    user,
};

export function apiErrorHandler(_err: any) {
    const err = _err as AxiosError<ApiRes>;

    const DEFAULT_MESSAGE = "Something went wrong. Please try again.";
    let message = DEFAULT_MESSAGE;

    if (err.name === "AxiosError") {
        if (err.status) {
            // We are not logged in. We don't want to bombard user with this error toast.
            if (err.status === 401) return;

            // We don't want to leak(to UI) anything if the server messed up.
            if (err.status >= 300 && err.status < 500) {
                if (err.response?.data.message) {
                    message = err.response.data.message;
                }
            }
        }
    }

    toast.error(message);
}
