import { useRef } from "react";
import { Textarea } from "netra";
import { Content } from "@tiptap/react";

import { WithDebounce } from "@/components/with_debounce";
import { usePositionStore } from "@/features/position/position_store_context";
import { SimpleEditor } from "@/tiptap/components/tiptap-templates/simple/simple-editor";

const MAX_NOTES_LENGTH = 4096;

export function PositionLogNotes() {
    const position = usePositionStore((s) => s.position);
    const updatePosition = usePositionStore((s) => s.updatePosition);
    const contentDataRef = useRef<Content>(position.notes);

    return (
        <>
            <WithDebounce
                state={position.notes}
                onDebounce={(v) => {
                    updatePosition({
                        notes: v,
                    });
                }}
            >
                {(value, setValue) => (
                    // <div className="flex w-full flex-col gap-y-2">
                    //     <Textarea
                    //         className="h-48 w-full resize-none whitespace-pre-wrap"
                    //         maxLength={4096}
                    //         value={value}
                    //         onChange={(e) => setValue(e.target.value)}
                    //         placeholder="Add notes here..."
                    //     />
                    //     {value.length > 4069 && (
                    //         <span className="text-xs">
                    //             {value.length} / {MAX_NOTES_LENGTH} characters used
                    //         </span>
                    //     )}
                    // </div>
                    <SimpleEditor
                        initialContent={value}
                        onChange={(editor) => {
                            contentDataRef.current = editor.getHTML();
                            // updatePosition({ notes: editor.getHTML() });
                            setValue(editor.getHTML());
                        }}
                    />
                )}
            </WithDebounce>
        </>
    );
}
