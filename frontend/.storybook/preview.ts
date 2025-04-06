import type { Preview } from "@storybook/react";

import "../src/index.css";

const preview: Preview = {
    parameters: {
        backgrounds: {
            values: [{ name: "Dark", value: "#000A14" }],
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
