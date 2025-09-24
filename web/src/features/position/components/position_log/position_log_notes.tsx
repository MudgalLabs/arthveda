import { Textarea } from "netra";

import { WithDebounce } from "@/components/with_debounce";
import { usePositionStore } from "@/features/position/position_store_context";

const MAX_NOTES_LENGTH = 4096;

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
                    <div className="flex w-full flex-col gap-y-2">
                        <Textarea
                            className="h-48 w-full resize-none whitespace-pre-wrap"
                            maxLength={4096}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="Add notes here..."
                        />
                        {value.length > 4069 && (
                            <span className="text-xs">
                                {value.length} / {MAX_NOTES_LENGTH} characters used
                            </span>
                        )}
                    </div>
                )}
            </WithDebounce>
        </div>
    );
}
