import { lazy, Suspense, FC, Fragment, PropsWithChildren } from "react";
import { Navigate, Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { usePostHog } from "posthog-js/react";

import "@/index.css";

import { useAuthentication } from "@/features/auth/auth_context";
import { toast, ToastProvider } from "@/components/toast";
import { AuthenticationProvider } from "@/features/auth/auth_context";
import { SidebarProvider } from "@/components/sidebar/sidebar_context";
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
    return (
        <Fragment>
            {/* Putting ToastProvider here instead of in main.tsx
                because putting it here gives Toasts access to react-router
                hooks and state. */}
            <ToastProvider />

            <AuthenticationProvider>
                <BrokerProvider>
                    <SidebarProvider>
                        <TooltipPrimitive.TooltipProvider>
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
                        </TooltipPrimitive.TooltipProvider>
                    </SidebarProvider>
                </BrokerProvider>
            </AuthenticationProvider>
            <ScrollRestoration />
        </Fragment>
    );
}
