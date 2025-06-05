import { IconGripVertical } from "@/components/icons";

export const WidgetDragHandle = () => {
    return (
        <div className="custom-drag-handle text-foreground-muted hover:text-foreground absolute top-2 right-1 flex h-8 cursor-grab">
            <IconGripVertical />
        </div>
    );
};
