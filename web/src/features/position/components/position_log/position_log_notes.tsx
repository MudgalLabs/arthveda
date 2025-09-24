import { Label, Textarea, WithLabel } from "netra";

import { WithDebounce } from "@/components/with_debounce";
import { usePositionStore } from "@/features/position/position_store_context";

export function PositionLogNotes() {
    const position = usePositionStore((s) => s.position);
    const updatePosition = usePositionStore((s) => s.updatePosition);

    return (
        <div className="flex flex-col gap-x-4 gap-y-4 sm:flex-row">
            <WithDebounce
                state={position.notes}
                onDebounce={(v) => {
                    updatePosition({
                        notes: v,
                    });
                }}
            >
                {(value, setValue) => (
                    <WithLabel
                        className="flex-1"
                        Label={
                            <Label className="flex w-full justify-between">
                                <span>Notes </span> <span className="text-xs">{value.length} / 4096</span>
                            </Label>
                        }
                    >
                        <Textarea
                            className="h-24 w-full resize-none whitespace-pre-wrap"
                            maxLength={4096}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="Add notes here..."
                        />
                    </WithLabel>
                )}
            </WithDebounce>
        </div>
    );
}
