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

export function InstrumentToggle({ defaultValue, value, onChange, error, errorMsg }: SegmentToggleProps) {
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
                <ToggleGroupItem value="equity" aria-label="Toggle equity">
                    Equity
                </ToggleGroupItem>

                <ToggleGroupItem value="future" aria-label="Toggle future">
                    Futures
                </ToggleGroupItem>

                <ToggleGroupItem value="option" aria-label="Toggle option">
                    Options
                </ToggleGroupItem>

                <ToggleGroupItem value="crypto" aria-label="Toggle crypto">
                    Crypto
                </ToggleGroupItem>
            </ToggleGroup>

            {error && errorMsg && <InputErrorMessage errorMsg={errorMsg} />}
        </>
    );
}
