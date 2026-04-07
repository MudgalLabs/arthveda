import * as auth from "@/hooks/api_hooks/auth";
import * as broker from "@/hooks/api_hooks/broker";
import * as calendar from "@/hooks/api_hooks/calendar";
import * as currency from "@/hooks/api_hooks/currency";
import * as dashboard from "@/hooks/api_hooks/dashboard";
import * as insight from "@/hooks/api_hooks/insight";
import * as position from "@/hooks/api_hooks/position";
import * as report from "@/hooks/api_hooks/report";
import * as subscription from "@/hooks/api_hooks/subscription";
import * as symbol from "@/hooks/api_hooks/symbol";
import * as tag from "@/hooks/api_hooks/tag";
import * as user from "@/hooks/api_hooks/user";
import * as userBrokerAccount from "@/hooks/api_hooks/user_broker_account";

export const apiHooks = {
    report,
    auth,
    broker,
    calendar,
    currency,
    dashboard,
    insight,
    subscription,
    symbol,
    tag,
    position,
    user,
    userBrokerAccount,
};
