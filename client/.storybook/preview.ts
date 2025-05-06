import type { Preview } from "@storybook/react";

import "../src/index.css";

const preview: Preview = {
    parameters: {
        backgrounds: {
            values: [{ name: "Dark", value: "hsl(224, 76%, 5%)" }],
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
