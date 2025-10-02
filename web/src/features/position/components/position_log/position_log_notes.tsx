import { useRef } from "react";
import { Content } from "@tiptap/react";

import { WithDebounce } from "@/components/with_debounce";
import { usePositionStore } from "@/features/position/position_store_context";
import { SimpleEditor } from "@/tiptap/components/tiptap-templates/simple/simple-editor";

export function PositionLogNotes() {
    const position = usePositionStore((s) => s.position);
    const updatePosition = usePositionStore((s) => s.updatePosition);
    const contentDataRef = useRef<Content>(position.journal_content);

    return (
        <>
            <WithDebounce
                state={position.journal_content}
                onDebounce={(v) => {
                    updatePosition({
                        journal_content: v,
                    });
                }}
            >
                {(value, setValue) => (
                    <SimpleEditor
                        initialContent={value}
                        onChange={(editor) => {
                            contentDataRef.current = editor.getJSON();
                            setValue(editor.getJSON());
                        }}
                    />
                )}
            </WithDebounce>
        </>
    );
}
