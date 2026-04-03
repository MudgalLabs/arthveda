import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useMemo } from "react";
import { useLocalStorageState } from "netra";

import { LocalStorageKeyTheme } from "@/lib/utils";

export type Theme = "dark_theme" | "light_theme";

interface ThemeContextType {
    theme: Theme;
    setTheme: (newTheme: Theme) => void;
    toggle: () => void;
    isDarkTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark_theme",
    setTheme: () => {},
    toggle: () => {},
    isDarkTheme: false,
});

function getSystemTheme(): Theme {
    if (typeof window === "undefined") return "dark_theme";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark_theme" : "light_theme";
}

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
    const systemTheme = getSystemTheme();
    const [theme, setTheme] = useLocalStorageState<Theme>(LocalStorageKeyTheme, systemTheme);

    const toggle = useCallback(() => {
        setTheme((prev) => (prev === "dark_theme" ? "light_theme" : "dark_theme"));
    }, [theme]);

    useEffect(() => {
        const root = document.documentElement;

        if (theme === "light_theme") {
            root.classList.add("light");
        } else {
            root.classList.remove("light");
        }
    }, [theme]);

    const value: ThemeContextType = useMemo(
        () => ({
            theme,
            setTheme,
            toggle,
            isDarkTheme: theme === "dark_theme",
        }),
        [theme, setTheme, toggle]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme: did you forget to use ThemeProvider?");
    }

    return context;
}
