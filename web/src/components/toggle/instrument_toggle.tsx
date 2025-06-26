import { PositionInstrument } from "@/features/position/position";
import { ToggleGroup, ToggleGroupItem, Tooltip } from "@/s8ly";
import { InputErrorMessage } from "@/components/input_error_message";
import { cn } from "@/lib/utils";

interface SegmentToggleProps {
    defaultValue?: PositionInstrument | "";
    value?: PositionInstrument | "";
    onChange?: (v: PositionInstrument | "") => void;
    error?: boolean;
    errorMsg?: string;
}

export function InstrumentToggle({ defaultValue, value, onChange, error, errorMsg }: SegmentToggleProps) {
    return (
        <>
            <ToggleGroup
                type="single"
                className={cn("[&_*]:h-8", {
                    "border-border-red!": error,
                })}
                defaultValue={defaultValue}
                value={value}
                onValueChange={onChange}
                size="small"
            >
                <ToggleGroupItem value="equity" aria-label="Toggle equity">
                    Equity
                </ToggleGroupItem>

                <Tooltip content="Futures support is coming soon">
                    <ToggleGroupItem value="futures" aria-label="Toggle future" disabled>
                        Futures
                    </ToggleGroupItem>
                </Tooltip>

                <Tooltip content="Options support is coming soon">
                    <ToggleGroupItem value="options" aria-label="Toggle option" disabled>
                        Options
                    </ToggleGroupItem>
                </Tooltip>
            </ToggleGroup>

            {error && errorMsg && <InputErrorMessage errorMsg={errorMsg} />}
        </>
    );
}
