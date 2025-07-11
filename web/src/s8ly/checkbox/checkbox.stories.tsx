import type { Meta } from "@storybook/react";

import { Checkbox as CheckboxComp, Label } from "@/s8ly";

const meta = {
    title: "s8ly/Checkbox",
    component: CheckboxComp,
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof CheckboxComp>;

export default meta;

export const Default = () => {
    return (
        <div className="flex-center gap-x-2">
            <CheckboxComp id="terms" />
            <Label htmlFor="terms"> Accept terms and conditions</Label>
        </div>
    );
};

export const Indeterminate = () => {
    return (
        <div className="flex-center gap-x-2">
            <CheckboxComp id="terms" checked="indeterminate" />
            <Label htmlFor="terms"> Accept terms and conditions</Label>
        </div>
    );
};

export const Disabled = () => {
    return (
        <div className="flex-center gap-x-2">
            <CheckboxComp id="terms" disabled />
            <Label className="peer-disabled:opacity-70" htmlFor="terms">
                Accept terms and conditions
            </Label>
        </div>
    );
};
