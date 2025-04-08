import { apiHooks } from "@/hooks/api-hooks";
import { createContext, FC, PropsWithChildren, useContext } from "react";

interface AuthenticationContextType {
    isLoading: boolean;
    isAuthenticated: boolean;
    userID: number;
    userEmail: string;
}

const AuthenticationContext = createContext<AuthenticationContextType>({
    isAuthenticated: false,
    isLoading: true,
    userID: 0,
    userEmail: "",
});

AuthenticationContext.Provider;

export const AuthenticationProvider: FC<PropsWithChildren> = ({ children }) => {
    const { data, isSuccess, isLoading } = apiHooks.user.useGetMe();

    const value = {
        isAuthenticated: isSuccess,
        isLoading,
        userID: data?.data?.id || 0,
        userEmail: data?.data?.email || "",
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
        console.error("useAuthentication: did you forget to use AuthProvider?");
    }

    return context;
}
