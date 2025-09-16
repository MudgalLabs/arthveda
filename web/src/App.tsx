import { lazy, Suspense, FC, Fragment, PropsWithChildren } from "react";
import { Navigate, Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { isProd, TooltipProvider, SidebarProvider } from "netra";
import { BodhvedaProvider } from "@bodhveda/react";
import { usePostHog } from "posthog-js/react";

import "@/index.css";
import "netra/styles.css";

import { toast, ToastProvider } from "@/components/toast";
import { useAuthentication } from "@/features/auth/auth_context";
import { LoadingScreen } from "@/components/loading_screen";
import { ROUTES, ROUTES_PROTECTED, ROUTES_PUBLIC } from "@/constants";
import { useURLState } from "@/hooks/use_url_state";
import { useEffectOnce } from "@/hooks/use_effect_once";
import { BrokerProvider, useBroker } from "@/features/broker/broker_context";
import PlanLimitExceededModal from "@/components/plan_limit_exceeded_modal";

const AppLayout = lazy(() => import("@/app_layout"));

const RouteHandler: FC<PropsWithChildren> = ({ children }) => {
    const posthog = usePostHog();
    const { isAuthenticated, isLoading, data } = useAuthentication();
    const { isLoading: isLoadingBrokerContext } = useBroker();
    const { pathname } = useLocation();

    const [isOAuthSuccess] = useURLState("oauth_success", false);
    const [isOAuthError] = useURLState("oauth_error", false);

    useEffectOnce(
        (deps) => {
            if (deps.isOAuthError) {
                toast.error("Failed to Continue with Google");
            }
        },
        { isOAuthError },
        (deps) => !!deps.isOAuthError
    );

    useEffectOnce(
        (deps) => {
            let message = "Welcome to Arthveda";

            const name = deps.data?.name;
            if (name) {
                message = `Welcome back, ${name}`;
            }

            posthog?.capture("User Signed In", {
                user_id: deps.data?.user_id,
                email: deps.data?.email,
                name: deps.data?.name,
            });
            toast.info(message, { icon: "😎" });
        },
        { isOAuthSuccess, data, isLoading },
        (deps) => deps.isOAuthSuccess && !deps.isLoading
    );

    if (isLoading || isLoadingBrokerContext) {
        return (
            <div className="h-screen w-screen">
                <LoadingScreen />
            </div>
        );
    }

    // The user is not signed in and is trying to access a protected route
    // or going to home('/') page. There is no home route.
    if (!isAuthenticated && (ROUTES_PROTECTED.includes(pathname) || pathname == ROUTES.index)) {
        // Redirect user to signin screen.
        return <Navigate to={ROUTES.signIn} />;
    }

    if (isAuthenticated) {
        // The user is trying to go to home(`/`) or to the auth flow route.
        // We should redirect the user to `/dashboard` as they are signed in.
        if (ROUTES_PUBLIC.includes(pathname)) {
            // Redirect user to dashboard.
            return <Navigate to={ROUTES.dashboard} />;
        }

        // User is about to visit an app route.
        if (ROUTES_PROTECTED.includes(pathname) || pathname.startsWith(pathname)) {
            return <AppLayout>{children}</AppLayout>;
        }
    }

    return <div className="h-screen w-screen">{children}</div>;
};

export default function App() {
    const { data } = useAuthentication();

    return (
        <Fragment>
            {/* Putting ToastProvider here instead of in main.tsx
                because putting it here gives Toasts access to react-router
                hooks and state. */}
            <ToastProvider />

            <BrokerProvider>
                <SidebarProvider>
                    <TooltipProvider>
                        <BodhvedaProvider
                            apiKey={import.meta.env.ARTHVEDA_BODHVEDA_CLIENT_API_KEY}
                            recipientID={data?.user_id || ""}
                        >
                            <Suspense
                                fallback={
                                    <div className="h-screen w-screen">
                                        <LoadingScreen />
                                    </div>
                                }
                            >
                                <RouteHandler>
                                    <Outlet />
                                    <PlanLimitExceededModal />
                                </RouteHandler>
                            </Suspense>
                        </BodhvedaProvider>
                    </TooltipProvider>
                </SidebarProvider>
            </BrokerProvider>

            <ScrollRestoration />
        </Fragment>
    );
}
