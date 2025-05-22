import { createContext, FC, PropsWithChildren, useContext } from "react";

import { apiHooks } from "@/hooks/api_hooks";
import { User } from "@/lib/api/user";
import { apiErrorHandler } from "@/lib/api";

interface AuthenticationContextType {
    isLoading: boolean;
    isAuthenticated: boolean;
    data: User | undefined;
}

const AuthenticationContext = createContext<AuthenticationContextType>({
    isAuthenticated: false,
    isLoading: true,
    data: undefined,
});

export const AuthenticationProvider: FC<PropsWithChildren> = ({ children }) => {
    const { data, isSuccess, isLoading, isError, error } =
        apiHooks.user.useMe();

    if (isError) {
        apiErrorHandler(error);
    }

    const value = {
        isLoading,
        isAuthenticated: isSuccess,
        data: data?.data,
    };

    return (
        <AuthenticationContext.Provider value={value}>
            {children}
        </AuthenticationContext.Provider>
    );
};

export function useAuthentication(): AuthenticationContextType {
    const context = useContext(AuthenticationContext);

    if (!context) {
        throw new Error(
            "useAuthentication: did you forget to use AuthProvider?"
        );
    }

    return context;
}
