import { Select, SelectOptionItem } from "@/s8ly";

import { IconMoon, IconSun } from "@/components/icons";
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
];

export function ThemeSelect() {
    const { theme, setTheme } = useTheme();

    return (
        <Select
            options={options}
            classNames={{
                trigger: "w-28!",
                content: "w-28!",
            }}
            value={theme}
            onValueChange={(val: Theme) => setTheme(val)}
        />
    );
}
