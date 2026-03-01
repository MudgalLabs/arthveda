import { FC, useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
    IconTags,
    Loading,
    PageHeading,
    DataTableColumnHeader,
    Button,
    Tooltip,
    IconPlus,
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Input,
    Label,
    IconEdit,
    IconTrash,
    IconChevronDown,
    IconChevronRight,
    DataTable,
    DataTableSmart,
    useDocumentTitle,
} from "netra";

import {
    useListTagGroups,
    useCreateTagGroup,
    useCreateTag,
    useUpdateTagGroup,
    useUpdateTag,
    useDeleteTagGroup,
    useDeleteTag,
} from "@/hooks/api_hooks/tag";
import { TagGroupWithTags, Tag } from "@/lib/api/tag";
import { toast } from "@/components/toast";

export function TagsManagement() {
    useDocumentTitle("Tags • Arthveda");
    const { data, isLoading } = useListTagGroups();

    const [openEditTagGroup, setOpenEditTagGroup] = useState(false);
    const [editTagGroup, setEditTagGroup] = useState<TagGroupWithTags | null>(null);

    const [editTag, setEditTag] = useState<Tag | null>(null);

    return (
        <>
            <PageHeading>
                <IconTags size={18} />
                <h1>Tags</h1>
                {isLoading && <Loading />}
            </PageHeading>

            <div className="mb-4">
                <TagGroupModal
                    renderTrigger={() => (
                        <Button className="">
                            <IconPlus size={16} /> Tag group
                        </Button>
                    )}
                    mode="create"
                    open={openEditTagGroup}
                    setOpen={setOpenEditTagGroup}
                />
            </div>

            <TagGroupsTable
                tagGroups={data?.data.tag_groups ?? []}
                onEditTagGroup={setEditTagGroup}
                onEditTag={setEditTag}
            />

            {editTagGroup && (
                <TagGroupModal
                    mode="update"
                    tagGroup={editTagGroup}
                    open={!!editTagGroup}
                    setOpen={(open) => !open && setEditTagGroup(null)}
                />
            )}

            {editTag && (
                <TagModal
                    mode="update"
                    tag={editTag}
                    groupId={editTag.group_id}
                    open={!!editTag}
                    setOpen={(open) => !open && setEditTag(null)}
                />
            )}
        </>
    );
}

export default TagsManagement;

const tagGroupColumns: ColumnDef<TagGroupWithTags>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader title="Group name" column={column} />,
        cell: ({ row }) => {
            return (
                <div className="flex-x">
                    {row.getCanExpand() && (
                        <Button
                            {...{
                                onClick: row.getToggleExpandedHandler(),
                                style: { cursor: "pointer" },
                            }}
                            variant="link"
                        >
                            <div className="flex-x">
                                <span>{row.original.name}</span>
                                {row.getIsExpanded() ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                            </div>
                        </Button>
                    )}

                    <Tooltip content="Tags in this group">
                        <p className="text-text-muted text-xs font-medium">{row.original.tags.length}</p>
                    </Tooltip>
                </div>
            );
        },
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader title="Tag group description" column={column} />,
        cell: ({ row }) => <span>{row.original.description}</span>,
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: "actions",
        header: ({ column }) => <DataTableColumnHeader title="Actions" column={column} />,
        cell: ({ row, table }) => {
            const [deleteOpen, setDeleteOpen] = useState(false);
            const { mutate: deleteTagGroup, isPending: isDeleting } = useDeleteTagGroup({
                onSuccess: () => {
                    toast.success("Tag group deleted successfully");
                    setDeleteOpen(false);
                },
                onError: () => {
                    toast.error("Failed to delete tag group");
                },
            });

            return (
                <div className="flex gap-x-2">
                    <Tooltip content="Edit tag group" delayDuration={500}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => table.options.meta?.extra?.onEditTagGroup(row.original)}
                        >
                            <IconEdit size={16} />
                        </Button>
                    </Tooltip>
                    <Tooltip content="Delete tag group" delayDuration={500}>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
                            <IconTrash size={16} />
                        </Button>
                    </Tooltip>
                    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete "{row.original.name}" tag group</DialogTitle>

                                <DialogDescription>
                                    Are you sure you want to delete <b>{row.original.name}</b> tag group?
                                </DialogDescription>
                            </DialogHeader>
                            All tags in this group will also be deleted. The positions associated with these tags will
                            no longer have these tags.
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    loading={isDeleting}
                                    onClick={() => deleteTagGroup(row.original.id)}
                                >
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        },
        enableSorting: false,
        enableHiding: false,
    },
];

const tagColumns: ColumnDef<Tag>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader title="Tag name" column={column} />,
        cell: ({ row }) => <span>{row.original.name}</span>,
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader title="Tag description" column={column} />,
        cell: ({ row }) => <span>{row.original.description}</span>,
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: "actions",
        header: ({ column }) => <DataTableColumnHeader title="Actions" column={column} />,
        cell: ({ row, table }) => {
            const [deleteOpen, setDeleteOpen] = useState(false);
            const { mutate: deleteTag, isPending: isDeleting } = useDeleteTag({
                onSuccess: () => {
                    toast.success("Tag deleted successfully");
                    setDeleteOpen(false);
                },
                onError: () => {
                    toast.error("Failed to delete tag");
                },
            });

            return (
                <div className="flex gap-x-2">
                    <Tooltip content="Edit tag" delayDuration={500}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => table.options.meta?.extra?.onEditTag(row.original)}
                        >
                            <IconEdit size={16} />
                        </Button>
                    </Tooltip>
                    <Tooltip content="Delete tag" delayDuration={500}>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
                            <IconTrash size={16} />
                        </Button>
                    </Tooltip>
                    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete "{row.original.name}" tag</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete <b>{row.original.name}</b> tag?
                                </DialogDescription>
                            </DialogHeader>
                            This tag will be removed from all positions it is attached to.
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    loading={isDeleting}
                                    onClick={() => deleteTag(row.original.id)}
                                >
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        },
        enableSorting: false,
        enableHiding: false,
    },
];

const TagGroupsTable: FC<{
    tagGroups: TagGroupWithTags[];
    onEditTagGroup?: (tg: TagGroupWithTags) => void;
    onEditTag?: (tag: Tag) => void;
}> = ({ tagGroups, onEditTagGroup, onEditTag }) => {
    const [openCreateTagModalGroupId, setOpenCreateTagModalGroupId] = useState<string | null>(null);

    return (
        <DataTableSmart
            data={tagGroups}
            columns={tagGroupColumns}
            getRowCanExpand={() => true}
            extra={{ onEditTagGroup }}
        >
            {(table) => (
                <DataTable
                    table={table}
                    renderSubComponent={({ row }) => (
                        <div className="bg-surface-2 px-4 py-2">
                            <div className="mb-4">
                                <TagModal
                                    renderTrigger={() => (
                                        <Button
                                            className=""
                                            onClick={() => setOpenCreateTagModalGroupId(row.original.id)}
                                        >
                                            <IconPlus size={16} /> Tag
                                        </Button>
                                    )}
                                    groupId={row.original.id}
                                    mode="create"
                                    open={openCreateTagModalGroupId === row.original.id}
                                    setOpen={(open) => {
                                        if (!open) setOpenCreateTagModalGroupId(null);
                                    }}
                                />
                            </div>

                            <DataTableSmart data={row.original.tags} columns={tagColumns} extra={{ onEditTag }}>
                                {(tagTable) => <DataTable table={tagTable} />}
                            </DataTableSmart>
                        </div>
                    )}
                />
            )}
        </DataTableSmart>
    );
};

interface TagGroupModalProps {
    renderTrigger?: () => React.ReactNode;
    mode: "create" | "update";
    tagGroup?: TagGroupWithTags;
    open: boolean;
    setOpen: (open: boolean) => void;
}
const TagGroupModal: FC<TagGroupModalProps> = ({ renderTrigger, mode, tagGroup, open, setOpen }) => {
    const [name, setName] = useState(tagGroup?.name ?? "");
    const [description, setDescription] = useState(tagGroup?.description ?? "");

    const { mutate: createTagGroup, isPending: isCreating } = useCreateTagGroup({
        onSuccess: () => {
            toast.success("Tag group created successfully");
            setOpen(false);
        },
        onError: () => {
            toast.error("Failed to create tag group");
        },
    });

    const { mutate: updateTagGroup, isPending: isUpdating } = useUpdateTagGroup({
        onSuccess: () => {
            toast.success("Tag group updated successfully");
            setOpen(false);
        },
        onError: () => {
            toast.error("Failed to update tag group");
        },
    });

    useEffect(() => {
        if (open) {
            setName(tagGroup?.name ?? "");
            setDescription(tagGroup?.description ?? "");
        }
    }, [open, tagGroup]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (mode === "create") {
            createTagGroup({ name: name.trim(), description: description.trim() || null });
        } else if (mode === "update" && tagGroup) {
            updateTagGroup({ tag_group_id: tagGroup.id, name: name.trim(), description: description.trim() });
        }
    };

    const disableAction = !name.trim();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {renderTrigger && <DialogTrigger asChild>{renderTrigger()}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Create a tag group" : "Edit tag group"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Create a new tag group to organize your tags. Then you can add tags to this tag group."
                            : "Update the tag group name and description."}
                    </DialogDescription>
                </DialogHeader>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <Label>Name</Label>
                    <Input
                        className="w-full!"
                        placeholder="Mistakes"
                        type="text"
                        required
                        maxLength={64}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Label>Description</Label>
                    <Input
                        className="w-full!"
                        placeholder="Common mistakes made"
                        type="text"
                        maxLength={128}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={disableAction}
                            loading={mode === "create" ? isCreating : isUpdating}
                        >
                            {mode === "create" ? "Create" : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

interface TagModalProps {
    renderTrigger?: () => React.ReactNode;
    groupId: string;
    mode: "create" | "update";
    tag?: Tag;
    open?: boolean;
    setOpen?: (open: boolean) => void;
}
const TagModal: FC<TagModalProps> = ({ renderTrigger, groupId, mode, tag, open, setOpen }) => {
    const [name, setName] = useState(tag?.name ?? "");
    const [description, setDescription] = useState(tag?.description ?? "");

    const { mutate: createTag, isPending: isCreating } = useCreateTag({
        onSuccess: () => {
            toast.success("Tag created successfully");
            setOpen?.(false);
        },
        onError: () => {
            toast.error("Failed to create tag");
        },
    });

    const { mutate: updateTag, isPending: isUpdating } = useUpdateTag({
        onSuccess: () => {
            toast.success("Tag updated successfully");
            setOpen?.(false);
        },
        onError: () => {
            toast.error("Failed to update tag");
        },
    });

    useEffect(() => {
        if (open) {
            setName(tag?.name ?? "");
            setDescription(tag?.description ?? "");
        } else {
            setName("");
            setDescription("");
        }
    }, [open, tag]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (mode === "create") {
            createTag({ group_id: groupId, name: name.trim(), description: description.trim() || null });
        } else if (mode === "update" && tag) {
            updateTag({ tag_id: tag.id, name: name.trim(), description: description.trim() });
        }
    };

    const disableAction = !name.trim();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {renderTrigger && <DialogTrigger asChild>{renderTrigger()}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Create tag" : "Edit tag"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create" ? "Create a new tag in this group." : "Update the tag name and description."}
                    </DialogDescription>
                </DialogHeader>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <Label>Name</Label>
                    <Input
                        className="w-full!"
                        placeholder="FOMO"
                        type="text"
                        required
                        maxLength={64}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Label>Description</Label>
                    <Input
                        className="w-full!"
                        placeholder="Fear of missing out"
                        type="text"
                        maxLength={128}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={disableAction}
                            loading={mode === "create" ? isCreating : isUpdating}
                        >
                            {mode === "create" ? "Create" : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
