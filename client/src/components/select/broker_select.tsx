import { Select, SelectOptionItem, SelectProps } from "@/s8ly";

import { apiHooks } from "@/hooks/api_hooks";
import { apiErrorHandler } from "@/lib/api";
import { useEffectOnce } from "@/hooks/use_effect_once";

function BrokerSelect(props: Omit<SelectProps, "options">) {
    const { data, isLoading, error, isError } = apiHooks.broker.useList();

    useEffectOnce(
        (deps) => {
            if (deps.isError) {
                apiErrorHandler(deps.error);
            }
        },
        { isError, error },
        (deps) => {
            return deps.isError === true;
        }
    );

    const items = data?.data || [];
    const options: SelectOptionItem[] = items.map((i) => ({
        label: i.name,
        value: i.id,
    }));

    options.push({
        value: "-1",
        label: (
            <>
                <p>
                    Don't see your broker here? We are working on supporting
                    more brokers!
                </p>
            </>
        ),
        disabled: true,
    });

    return <Select loading={isLoading} options={options} {...props} />;
}

export { BrokerSelect };
