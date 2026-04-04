import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useMemo } from "react";
import { useLocalStorageState } from "netra";

import { LocalStorageKeyTheme } from "@/lib/utils";

export type Theme = "dark_theme" | "light_theme" | "system";

interface ThemeContextType {
    theme: Theme;
    setTheme: (newTheme: Theme) => void;
    toggle: () => void;
    isDarkTheme: boolean;
    resolvedTheme: Omit<Theme, "system">;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark_theme",
    setTheme: () => {},
    toggle: () => {},
    isDarkTheme: false,
    resolvedTheme: "dark_theme",
});

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
    const [theme, setTheme] = useLocalStorageState<Theme>(LocalStorageKeyTheme, "system");

    const toggle = useCallback(() => {
        setTheme((prev) => {
            const resolved = resolveTheme(prev);
            return resolved === "dark_theme" ? "light_theme" : "dark_theme";
        });
    }, []);

    useEffect(() => {
        const resolved = resolveTheme(theme);
        applyTheme(resolved);
    }, [theme]);

    useEffect(() => {
        if (theme !== "system") return;

        const media = window.matchMedia("(prefers-color-scheme: dark)");

        const handler = () => {
            const resolved = getSystemTheme();
            applyTheme(resolved);
        };

        media.addEventListener("change", handler);
        return () => media.removeEventListener("change", handler);
    }, [theme]);

    const value: ThemeContextType = useMemo(
        () => ({
            theme,
            setTheme,
            toggle,
            isDarkTheme: theme === "dark_theme",
            resolvedTheme: resolveTheme(theme),
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

function getSystemTheme(): Theme {
    if (typeof window === "undefined") return "dark_theme";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark_theme" : "light_theme";
}

function resolveTheme(theme: Theme): Theme {
    if (theme === "system") return getSystemTheme();
    return theme;
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;

    if (theme === "light_theme") {
        root.classList.add("light");
    } else {
        root.classList.remove("light");
    }
}
