import * as auth from "@/hooks/api_hooks/auth";
import * as currency from "@/hooks/api_hooks/currency";
import * as dashboard from "@/hooks/api_hooks/dashboard";
import * as position from "@/hooks/api_hooks/position";
import * as user from "@/hooks/api_hooks/user";

export const apiHooks = {
    auth,
    currency,
    dashboard,
    position,
    user,
};
