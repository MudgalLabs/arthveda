import { AxiosError } from "axios";

import { ApiRes } from "@/lib/api/client";
import { toast } from "@/components/toast";
import * as auth from "@/lib/api/auth";
import * as broker from "@/lib/api/broker";
import * as calendar from "@/lib/api/calendar";
import * as currency from "@/lib/api/currency";
import * as dashboard from "@/lib/api/dashboard";
import * as position from "@/lib/api/position";
import * as subscription from "@/lib/api/subscription";
import * as symbol from "@/lib/api/symbol";
import * as tag from "@/lib/api/tag";
import * as upload from "@/lib/api/upload";
import * as user from "@/lib/api/user";
import * as userBrokerAccount from "@/lib/api/user_broker_account";
import { useUpgradeModalStore } from "@/components/plan_limit_exceeded_modal";

export const api = {
    auth,
    broker,
    calendar,
    currency,
    dashboard,
    position,
    subscription,
    symbol,
    tag,
    upload,
    user,
    userBrokerAccount,
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
                const data: any = _err.response?.data.data;

                if (_err.response?.data.message) {
                    message = _err.response.data.message;
                }

                if (_err.status === 403 && data.code === "plan_limit_exceeded") {
                    const showUpgradeModal = useUpgradeModalStore.getState().showUpgradeModal;
                    showUpgradeModal(data.feature);
                    return;
                }

                if (_err.status === 429) {
                    toast.error("You’re going too fast!", {
                        description: "Give it a sec and try again.",
                    });
                    return;
                }
            }
        }
    }

    toast.error(message);
}
