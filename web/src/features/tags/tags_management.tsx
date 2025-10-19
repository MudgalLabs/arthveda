import { FC, useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
    IconTags,
    Loading,
    PageHeading,
    DataTableColumnHeader,
    Button,
    Tooltip,
    Table,
    TableRow,
    TableCell,
    TableBody,
    TableHead,
    TableHeader,
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
} from "netra";

import { useListTagGroups, useCreateTagGroup, useCreateTag } from "@/hooks/api_hooks/tag";
import { TagGroupWithTags, Tag } from "@/lib/api/tag";
import { DataTableSmart } from "@/s8ly/data_table/data_table_smart";
import { toast } from "@/components/toast";
import { DataTable } from "@/s8ly";

export function TagsManagement() {
    const { data, isLoading } = useListTagGroups();

    return (
        <>
            <PageHeading>
                <IconTags size={18} />
                <h1>Tags</h1>
                {isLoading && <Loading />}
            </PageHeading>

            <div className="mb-4 flex justify-end">
                <CreateTagGroupModal
                    renderTrigger={() => (
                        <Button className="">
                            <IconPlus size={16} /> Tag Group
                        </Button>
                    )}
                />
            </div>

            <TagGroupsTable tagGroups={data?.data.tag_groups ?? []} />
        </>
    );
}

export default TagsManagement;

const tagGroupColumns: ColumnDef<TagGroupWithTags>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader title="Group Name" column={column} />,
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
        enableSorting: true,
        enableHiding: false,
    },
    {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader title="Tag Group Description" column={column} />,
        cell: ({ row }) => (
            <span>{row.original.description || <span className="text-text-muted">No description</span>}</span>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: "actions",
        header: ({ column }) => <DataTableColumnHeader title="Actions" column={column} />,
        cell: ({ row }) => (
            <div className="flex gap-x-2">
                <Tooltip content="Edit Tag Group" delayDuration={500}>
                    <Button variant="ghost" size="icon">
                        <IconEdit size={16} />
                    </Button>
                </Tooltip>
                <Tooltip content="Delete Tag Group" delayDuration={500}>
                    <Button variant="ghost" size="icon">
                        <IconTrash size={16} />
                    </Button>
                </Tooltip>
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
];

const tagColumns: ColumnDef<Tag>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader title="Tag Name" column={column} />,
        cell: ({ row }) => <span>{row.original.name}</span>,
    },
    {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader title="Tag Description" column={column} />,
        cell: ({ row }) => (
            <span>{row.original.description || <span className="text-text-muted">No description</span>}</span>
        ),
        enableSorting: false,
        enableHiding: false,
    },
];

const TagGroupsTable: FC<{ tagGroups: TagGroupWithTags[] }> = ({ tagGroups }) => {
    return (
        <DataTableSmart data={tagGroups} columns={tagGroupColumns} getRowCanExpand={() => true}>
            {(table) => (
                <DataTable
                    table={table}
                    renderSubComponent={({ row }) => (
                        <div className="p-4">
                            <div className="mb-4 flex justify-end">
                                <CreateTagModal
                                    renderTrigger={() => (
                                        <Button className="">
                                            <IconPlus size={16} /> Tag
                                        </Button>
                                    )}
                                    groupId={row.original.id}
                                />
                            </div>
                            <DataTableSmart data={row.original.tags} columns={tagColumns}>
                                {(tagTable) => <DataTable table={tagTable} />}
                            </DataTableSmart>
                        </div>
                    )}
                />
            )}
        </DataTableSmart>
    );
};

interface CreateTagGroupModalProps {
    renderTrigger: () => React.ReactNode;
}

const CreateTagGroupModal: FC<CreateTagGroupModalProps> = ({ renderTrigger }) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const { mutate: createTagGroup, isPending } = useCreateTagGroup({
        onSuccess: () => {
            toast.success("Tag group created successfully");
            setOpen(false);
        },
        onError: () => {
            toast.error("Failed to create tag group");
        },
    });

    useEffect(() => {
        if (open) {
            setName("");
            setDescription("");
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        createTagGroup({ name: name.trim(), description: description.trim() || null });
    };

    const disableCreate = !name.trim();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{renderTrigger()}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Tag Group</DialogTitle>
                    <DialogDescription>
                        Create a new tag group to organize your tags. Then you can add tags to this tag group.
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
                        <Button type="submit" disabled={disableCreate} loading={isPending}>
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

interface CreateTagModalProps {
    renderTrigger: () => React.ReactNode;
    groupId: string;
}

const CreateTagModal: FC<CreateTagModalProps> = ({ renderTrigger, groupId }) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const { mutate: createTag, isPending } = useCreateTag({
        onSuccess: () => {
            toast.success("Tag created successfully");
            setOpen(false);
        },
        onError: () => {
            toast.error("Failed to create tag");
        },
    });

    useEffect(() => {
        if (open) {
            setName("");
            setDescription("");
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        createTag({ group_id: groupId, name: name.trim(), description: description.trim() || null });
    };

    const disableCreate = !name.trim();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{renderTrigger()}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Tag</DialogTitle>
                    <DialogDescription>Create a new tag in this group.</DialogDescription>
                </DialogHeader>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <Label>Name</Label>
                    <Input
                        className="w-full!"
                        placeholder="Typo"
                        type="text"
                        required
                        maxLength={64}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Label>Description</Label>
                    <Input
                        className="w-full!"
                        placeholder="Typographical error"
                        type="text"
                        maxLength={128}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <DialogFooter>
                        <Button type="submit" disabled={disableCreate} loading={isPending}>
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
