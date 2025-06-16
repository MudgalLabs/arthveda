import { AxiosError } from "axios";

import { ApiRes } from "@/lib/api/client";
import { toast } from "@/components/toast";
import * as auth from "@/lib/api/auth";
import * as broker from "@/lib/api/broker";
import * as currency from "@/lib/api/currency";
import * as dashboard from "@/lib/api/dashboard";
import * as position from "@/lib/api/position";
import * as user from "@/lib/api/user";

export const api = {
    auth,
    broker,
    currency,
    dashboard,
    position,
    user,
};

export function apiErrorHandler(err: any) {
    const _err = err as AxiosError<ApiRes>;

    // Don't show toast for cancelled requests
    if (_err.code === "ERR_CANCELED" || _err.name === "CanceledError") {
        return;
    }

    const DEFAULT_MESSAGE = "Something went wrong. Please try again.";
    let message = DEFAULT_MESSAGE;

    if (_err.name === "AxiosError") {
        if (_err.status) {
            // We are not logged in. We don't want to bombard user with this error toast.
            if (_err.status === 401) return;

            // We don't want to leak(to UI) anything if the server messed up.
            if (_err.status >= 300 && _err.status < 500) {
                if (_err.response?.data.message) {
                    message = _err.response.data.message;
                }
            }
        }
    }

    toast.error(message);
}
