import {
    createContext,
    FC,
    PropsWithChildren,
    useContext,
    useEffect,
    useMemo,
} from "react";

import { apiHooks } from "@/hooks/api_hooks";
import { User } from "@/lib/api/user";
import { apiErrorHandler } from "@/lib/api";
import { toast } from "@/components/toast";

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

    useEffect(() => {
        if (isSuccess) {
            toast.info(`Good to see you ${data?.data.display_name}!`, {
                icon: <p>🚀</p>,
            });
        }

        if (isError) {
            apiErrorHandler(error);
        }
    }, [isSuccess, data, isError, error]);

    const value = useMemo(
        () => ({
            isLoading,
            isAuthenticated: isSuccess,
            data: data?.data,
        }),
        [isLoading, isSuccess, data]
    );

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
