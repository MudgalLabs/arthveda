import { createContext, FC, PropsWithChildren, useContext, useMemo } from "react";

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
    const { data, isSuccess, isLoading } = apiHooks.user.useMe();

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
