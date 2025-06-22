import { createContext, FC, PropsWithChildren, useContext, useEffect, useMemo, useRef } from "react";
import { usePostHog } from "posthog-js/react";

import { apiHooks } from "@/hooks/api_hooks";
import { UserMeResponse } from "@/lib/api/user";

interface AuthenticationContextType {
    isLoading: boolean;
    isAuthenticated: boolean;
    data: UserMeResponse | undefined;
}

const AuthenticationContext = createContext<AuthenticationContextType>({
    isAuthenticated: false,
    isLoading: true,
    data: undefined,
});

export const AuthenticationProvider: FC<PropsWithChildren> = ({ children }) => {
    const posthog = usePostHog();
    const identifyCalledRef = useRef(false);

    const { data, isSuccess, isLoading } = apiHooks.user.useMe();

    useEffect(() => {
        if (!isSuccess || isLoading || !data || identifyCalledRef.current) return;

        if (data) {
            const user = data.data;
            posthog?.identify(user.user_id, {
                email: user.email,
                name: user.name,
                created_at: user.created_at,
            });
            identifyCalledRef.current = true;
        }
    }, []);

    const value = useMemo(
        () => ({
            isLoading,
            isAuthenticated: isSuccess,
            data: data?.data,
        }),
        [isLoading, isSuccess, data]
    );

    return <AuthenticationContext.Provider value={value}>{children}</AuthenticationContext.Provider>;
};

export function useAuthentication(): AuthenticationContextType {
    const context = useContext(AuthenticationContext);

    if (!context) {
        throw new Error("useAuthentication: did you forget to use AuthProvider?");
    }

    return context;
}
