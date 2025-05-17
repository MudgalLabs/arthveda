import { Select, SelectOptionItem, SelectProps } from "@/s8ly";

import { CurrencyCode } from "@/features/position/position";
import { getCurrencyLabel } from "@/lib/utils";

function CurrencySelect(props: Omit<SelectProps, "options">) {
    // TODO: This should be fetched from API.
    // Even if we support only 1 currency, we should allow the user to set their
    // currency ONCE otherwise we will end up with data with different currencies.
    // So right now we are hardcoding it to INR.
    const options: SelectOptionItem[] = [
        {
            value: "INR",
            label: getCurrencyLabel("INR"),
        },
        {
            value: "none" as CurrencyCode,
            label: (
                <>
                    <p>
                        Don't see your currency here? We are working on
                        supporting more currencies!
                    </p>
                </>
            ),
            disabled: true,
        },
    ];

    return <Select options={options} {...props} />;
}

export { CurrencySelect };
