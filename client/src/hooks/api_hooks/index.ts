import * as broker from "@/hooks/api_hooks/broker";
import * as currency from "@/hooks/api_hooks/currency";
import * as dashboard from "@/hooks/api_hooks/dashboard";
import * as position from "@/hooks/api_hooks/position";
import * as user from "@/hooks/api_hooks/user";

export const apiHooks = {
    broker,
    currency,
    dashboard,
    position,
    user,
};
