import { useRef } from "react";
import { Content } from "@tiptap/react";

import { WithDebounce } from "@/components/with_debounce";
import { usePositionStore } from "@/features/position/position_store_context";
import { SimpleEditor } from "@/tiptap/components/tiptap-templates/simple/simple-editor";
import { useIsCreatingPosition } from "@/features/position/position_store";
import { IconBadgeAlert } from "netra";

interface PositionLogNotesProps {
    savePosition: () => void;
}

export function PositionLogNotes(props: PositionLogNotesProps) {
    const { savePosition } = props;

    const position = usePositionStore((s) => s.position);
    const updatePosition = usePositionStore((s) => s.updatePosition);
    const contentDataRef = useRef<Content>(position.journal_content);
    const isCreatingPosition = useIsCreatingPosition();

    return (
        <>
            {isCreatingPosition && (
                <p className="text-text-muted flex-x">
                    <IconBadgeAlert /> Click on "Create" to be able to add images.
                </p>
            )}

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
                        disableImageButton={isCreatingPosition}
                        onImageUploadSuccess={savePosition}
                    />
                )}
            </WithDebounce>
        </>
    );
}
