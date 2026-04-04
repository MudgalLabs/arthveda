import { Select, SelectOptionItem } from "@/s8ly";

import { IconMonitor, IconMoon, IconSun } from "@/components/icons";
import { Theme, useTheme } from "@/features/settings/theme/theme_context";

const options: SelectOptionItem<Theme>[] = [
    {
        label: (
            <span className="flex-x">
                <IconMoon size={16} /> Dark
            </span>
        ),
        value: "dark_theme",
    },
    {
        label: (
            <span className="flex-x">
                <IconSun size={16} /> Light
            </span>
        ),
        value: "light_theme",
    },
    {
        label: (
            <span className="flex-x">
                <IconMonitor size={16} /> System
            </span>
        ),
        value: "system",
    },
];

export function ThemeSelect() {
    const { theme, setTheme } = useTheme();

    return (
        <Select
            options={options}
            classNames={{
                trigger: "w-36!",
                content: "w-36!",
            }}
            value={theme}
            onValueChange={(val: Theme) => setTheme(val)}
        />
    );
}
