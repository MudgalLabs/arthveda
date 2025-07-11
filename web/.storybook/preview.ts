import type { Preview } from "@storybook/react";

import "../src/index.css";

const preview: Preview = {
    parameters: {
        backgrounds: {
            values: [{ name: "Dark", value: "var(--color-surface-0)" }],
            default: "Dark",
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
};

export default preview;
