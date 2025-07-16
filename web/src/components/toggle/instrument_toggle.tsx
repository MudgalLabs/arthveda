import { PositionInstrument } from "@/features/position/position";
import { ToggleGroup, ToggleGroupItem, Tooltip } from "@/s8ly";
import { InputErrorMessage } from "@/components/input_error_message";
import { cn } from "@/lib/utils";

export interface InstrumentDisableConfig {
    equity?: boolean;
    future?: boolean;
    option?: boolean;
    crypto?: boolean;
}

export interface InstrumentHideConfig {
    equity?: boolean;
    future?: boolean;
    option?: boolean;
    crypto?: boolean;
}

interface SegmentToggleProps {
    defaultValue?: PositionInstrument | "";
    value?: PositionInstrument | "";
    onChange?: (v: PositionInstrument | "") => void;
    error?: boolean;
    errorMsg?: string;
    disableConfig?: InstrumentDisableConfig;
    hideConfig?: InstrumentHideConfig;
}

export function InstrumentToggle({
    defaultValue,
    value,
    onChange,
    error,
    errorMsg,
    disableConfig,
    hideConfig,
}: SegmentToggleProps) {
    return (
        <>
            <ToggleGroup
                type="single"
                className={cn("[&_*]:h-8", {
                    "border-b-border-red! rounded-md border-b-1": error,
                })}
                defaultValue={defaultValue}
                value={value}
                onValueChange={onChange}
                size="small"
            >
                {!hideConfig?.equity && (
                    <Tooltip content="Equity support is coming soon" disabled={!disableConfig?.equity}>
                        <ToggleGroupItem value="equity" aria-label="Toggle equity" disabled={disableConfig?.equity}>
                            Equity
                        </ToggleGroupItem>
                    </Tooltip>
                )}

                {!hideConfig?.future && (
                    <Tooltip content="Futures support is coming soon" disabled={!disableConfig?.future}>
                        <ToggleGroupItem value="future" aria-label="Toggle future" disabled={disableConfig?.future}>
                            Futures
                        </ToggleGroupItem>
                    </Tooltip>
                )}

                {!hideConfig?.option && (
                    <Tooltip content="Options support is coming soon" disabled={!disableConfig?.option}>
                        <ToggleGroupItem value="option" aria-label="Toggle option" disabled={disableConfig?.option}>
                            Options
                        </ToggleGroupItem>
                    </Tooltip>
                )}

                {!hideConfig?.crypto && (
                    <Tooltip content="Crypto support is coming soon" disabled={!disableConfig?.crypto}>
                        <ToggleGroupItem value="crypto" aria-label="Toggle crypto" disabled={disableConfig?.crypto}>
                            Crypto
                        </ToggleGroupItem>
                    </Tooltip>
                )}
            </ToggleGroup>

            {error && errorMsg && <InputErrorMessage errorMsg={errorMsg} />}
        </>
    );
}
