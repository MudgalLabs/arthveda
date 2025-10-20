import { useEffect, useState } from "react";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    Button,
    Checkbox,
    IconPlus,
    useControlled,
    LoadingScreen,
    IconSettings,
} from "netra";

import { ScrollArea } from "@/s8ly";
import { Tag, TagGroup } from "@/lib/api/tag";
import { useListTagGroups } from "@/hooks/api_hooks/tag";
import { Link } from "./link";
import { ROUTES } from "@/constants";

interface TagPickerProps {
    value?: Tag[];
    onChange?: (value: Tag[]) => void;
}

export default function TagPicker({ value: valueProp, onChange }: TagPickerProps) {
    const { data, isLoading } = useListTagGroups();
    const tagGroups: TagGroup[] = data?.data?.tag_groups || [];

    const [open, setOpen] = useState(false);
    const [activeGroup, setActiveGroup] = useState<TagGroup | null>(null);

    useEffect(() => {
        if (tagGroups.length > 0 && !activeGroup) {
            setActiveGroup(tagGroups[0]);
        }
    }, [tagGroups, activeGroup]);

    const [value, setValue] = useControlled<Tag[]>({
        controlled: valueProp,
        default: [],
        name: "value",
    });

    const hasSelectedTags = value.length > 0;
    const isTagSelected = (tagId: string) => value.some((t) => t.id === tagId);

    const toggleTag = (tag: Tag) => {
        if (value.includes(tag)) {
            const newValue = value.filter((id) => id !== tag);
            onChange?.(newValue);
            setValue(newValue);
        } else {
            const newValue = [...value, tag];
            onChange?.(newValue);
            setValue(newValue);
        }
    };

    const selectedByGroup = tagGroups.reduce<Record<string, Tag[]>>((acc, g) => {
        const selected = g.tags.filter((t) => isTagSelected(t.id));
        if (selected.length > 0) acc[g.name] = selected;
        return acc;
    }, {});

    return (
        <div className="space-y-3">
            <Popover open={open} onOpenChange={setOpen}>
                <div className="flex-x w-full">
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedByGroup).map(([group, tags]) => (
                            <div key={group} className="flex items-center gap-1">
                                <span className="font-medium">{group}:</span>
                                <span className="text-muted-foreground">{tags.map((t) => t.name).join(", ")}</span>
                            </div>
                        ))}
                    </div>

                    <PopoverTrigger asChild>
                        <Button variant="secondary" size={hasSelectedTags ? "icon" : "default"}>
                            <IconPlus size={16} /> {!hasSelectedTags && "Tag"}
                        </Button>
                    </PopoverTrigger>
                </div>

                <PopoverContent className="min-w-[320px] p-0">
                    {isLoading ? (
                        <LoadingScreen />
                    ) : (
                        <div className="border-border-subtle flex overflow-hidden rounded-md border-b-1">
                            <ScrollArea className="border-r-border-subtle h-64 w-1/3 border-r-1">
                                <div className="space-y-2 p-2">
                                    {tagGroups.map((g) => (
                                        <Button
                                            key={g.id}
                                            onClick={() => setActiveGroup(g)}
                                            variant={activeGroup?.id === g.id ? "primary" : "secondary"}
                                            className="h-8 w-full"
                                        >
                                            {g.name}
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>

                            <ScrollArea className="h-64 w-2/3 p-3">
                                {activeGroup ? (
                                    <div className="space-y-2">
                                        {activeGroup.tags.map((t) => (
                                            <label key={t.id} className="flex cursor-pointer items-center space-x-2">
                                                <Checkbox
                                                    checked={isTagSelected(t.id)}
                                                    onCheckedChange={() => toggleTag(t)}
                                                />
                                                <span className="text-sm">{t.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {tagGroups.length === 0 ? (
                                            <div className="text-muted-foreground p-3 text-sm">
                                                <div className="space-y-2">
                                                    <p>You have not created any tags yet.</p>
                                                    <p>Click on "Manage tags" to create them.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-muted-foreground p-3 text-sm">
                                                Select a tag group to view its tags
                                            </div>
                                        )}
                                    </>
                                )}
                            </ScrollArea>
                        </div>
                    )}

                    <div className="flex justify-end p-2">
                        <Link to={ROUTES.tags}>
                            <Button variant="link" size="small">
                                <IconSettings size={16} /> Manage tags
                            </Button>
                        </Link>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
