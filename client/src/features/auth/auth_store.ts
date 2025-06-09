import { create } from "zustand";

import {
    loadFromLocalStorage,
    PersistKeyAccessToken,
    PersistKeyUser,
    removeFromLocalStorage,
    saveToLocalStorage,
} from "@/lib/utils";
import { User } from "@/lib/api/user";

interface AuthState {
    accessToken: string | null;
    user: User | null;
    isLoading: boolean;
}

interface AuthAction {
    setAccessToken: (token: string) => void;
    removeAccessToken: () => void;
    setUser: (user: User) => void;
    removeUser: () => void;
    setIsLoading: (isLoading: boolean) => void;
}

export interface AuthStore extends AuthState, AuthAction {}

const initial: AuthState = {
    accessToken: loadFromLocalStorage(PersistKeyAccessToken) ?? "",
    user: loadFromLocalStorage(PersistKeyUser),
    isLoading: true,
};

export const useAuthStore = create<AuthStore>((set) => ({
    ...initial,

    setAccessToken: (token) => {
        set({ accessToken: token });
        saveToLocalStorage(PersistKeyAccessToken, JSON.stringify(token));
    },

    removeAccessToken: () => {
        set({ accessToken: null });
        removeFromLocalStorage(PersistKeyAccessToken);
    },

    setUser: (user) => {
        set({ user });
        saveToLocalStorage(PersistKeyUser, JSON.stringify(user));
    },

    removeUser: () => {
        set({ user: null });
        removeFromLocalStorage(PersistKeyUser);
    },

    setIsLoading: (isLoading) => set({ isLoading }),
}));
