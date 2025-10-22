import * as analytics from "@/hooks/api_hooks/analytics";
import * as auth from "@/hooks/api_hooks/auth";
import * as broker from "@/hooks/api_hooks/broker";
import * as calendar from "@/hooks/api_hooks/calendar";
import * as currency from "@/hooks/api_hooks/currency";
import * as dashboard from "@/hooks/api_hooks/dashboard";
import * as position from "@/hooks/api_hooks/position";
import * as subscription from "@/hooks/api_hooks/subscription";
import * as symbol from "@/hooks/api_hooks/symbol";
import * as tag from "@/hooks/api_hooks/tag";
import * as user from "@/hooks/api_hooks/user";
import * as userBrokerAccount from "@/hooks/api_hooks/user_broker_account";

export const apiHooks = {
    analytics,
    auth,
    broker,
    calendar,
    currency,
    dashboard,
    subscription,
    symbol,
    tag,
    position,
    user,
    userBrokerAccount,
};
