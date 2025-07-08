import { FC, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import isEqual from "lodash/isEqual";

import { BrokerLogo } from "@/components/broker_logo";
import { IconEdit, IconPlus, IconTrash } from "@/components/icons";
import { LoadingScreen } from "@/components/loading_screen";
import { PageHeading } from "@/components/page_heading";
import { useBroker } from "@/features/broker/broker_context";
import { apiHooks } from "@/hooks/api_hooks";
import { UserBrokerAccount } from "@/lib/api/user_broker_account";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import { DataTableSmart } from "@/s8ly/data_table/data_table_smart";
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Input,
    Label,
    DataTable,
    Tooltip,
    DialogFooter,
    DialogOverlay,
    DialogPortal,
} from "@/s8ly";
import { WithLabel } from "@/components/with_label";
import { BrokerSelect } from "@/components/select/broker_select";
import { toast } from "@/components/toast";
import { apiErrorHandler } from "@/lib/api";

export const BrokerAccounts = () => {
    return (
        <>
            <PageHeading heading="Broker Accounts" />

            <div className="flex justify-end">
                <AddBrokerAccountModal
                    renderTrigger={() => (
                        <Button>
                            <IconPlus size={16} /> New
                        </Button>
                    )}
                />
            </div>

            <div className="h-4" />

            <BrokerAccountsTable />
        </>
    );
};

export default BrokerAccounts;

const columns: ColumnDef<UserBrokerAccount>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader title="Name" column={column} />,
        enableHiding: false,
        enableSorting: true,
    },
    {
        accessorKey: "broker_id",
        header: ({ column }) => <DataTableColumnHeader title="Broker" column={column} />,
        cell: ({ row }) => {
            const { getBrokerNameById } = useBroker();
            return (
                <span className="flex-x gap-x-4">
                    <BrokerLogo brokerId={row.original.broker_id} className="h-6 w-6" />
                    <span>{getBrokerNameById(row.original.broker_id)}</span>
                </span>
            );
        },
        enableHiding: false,
        enableSorting: false,
    },
    {
        id: "actions",
        header: ({ column }) => <DataTableColumnHeader title="Actions" column={column} />,
        cell: ({ row }) => {
            return (
                <div className="flex-x gap-x-0">
                    <Tooltip content="Edit" delayDuration={500}>
                        <EditBrokerAccountModal
                            userBrokerAccount={row.original}
                            renderTrigger={() => (
                                <Button variant="ghost" size="icon">
                                    <IconEdit size={16} />
                                </Button>
                            )}
                        />
                    </Tooltip>

                    <Tooltip content="Delete" delayDuration={500}>
                        <DeleteBrokerAccountModal
                            id={row.original.id}
                            name={row.original.name}
                            renderTrigger={() => (
                                <Button variant="ghost" size="icon">
                                    <IconTrash size={16} />
                                </Button>
                            )}
                        />
                    </Tooltip>
                </div>
            );
        },
        enableHiding: false,
        enableSorting: false,
    },
];

const BrokerAccountsTable = () => {
    const { data, isLoading, isError } = apiHooks.userBrokerAccount.useList();

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (isError || !data) {
        return <p className="text-foreground-red">Failed to fetch broker accounts</p>;
    }

    return (
        <DataTableSmart data={data.data} columns={columns}>
            {(table) => <DataTable table={table} />}
        </DataTableSmart>
    );
};

interface AddBrokerAccountModalProps {
    renderTrigger: () => ReactNode;
}

export const AddBrokerAccountModal: FC<AddBrokerAccountModalProps> = ({ renderTrigger }) => {
    const [open, setOpen] = useState(false);

    const [name, setName] = useState("");
    const [brokerId, setBrokerId] = useState("");

    // Using `useRef` didn't work as expected with the Dialog component.
    const [dialogEl, setDialogEl] = useState<HTMLElement | null>(null);
    const handleRef = useCallback((node: HTMLElement | null) => {
        if (node) setDialogEl(node);
    }, []);

    const { mutate: create, isPending } = apiHooks.userBrokerAccount.useCreate({
        onSuccess: () => {
            toast.success("Broker Account created successfully");
            setOpen(false);
        },
        onError: apiErrorHandler,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !brokerId) {
            return;
        }

        create({
            name,
            broker_id: brokerId,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{renderTrigger()}</DialogTrigger>

            <DialogContent ref={handleRef}>
                <DialogHeader>
                    <DialogTitle>Create Broker Account</DialogTitle>
                    <DialogDescription className="max-w-[80%]">
                        Create a broker account to link and organize positions imported or synced from your broker.
                    </DialogDescription>
                </DialogHeader>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <WithLabel Label={<Label>Name</Label>}>
                        <Input
                            className="w-full!"
                            placeholder="Swing Trading Account"
                            type="text"
                            required
                            maxLength={64}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </WithLabel>

                    <WithLabel Label={<Label>Broker</Label>}>
                        <BrokerSelect
                            container={dialogEl}
                            classNames={{
                                trigger: "w-full!",
                                content: "w-full!",
                            }}
                            required
                            value={brokerId}
                            onValueChange={setBrokerId}
                        />
                    </WithLabel>

                    <DialogFooter>
                        <Button type="submit" disabled={!name.trim() || !brokerId} loading={isPending}>
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

interface DeleteBrokerAccountModalProps {
    id: string;
    name: string;
    renderTrigger: () => ReactNode;
}

const DeleteBrokerAccountModal: FC<DeleteBrokerAccountModalProps> = ({ id, name, renderTrigger }) => {
    const [open, setOpen] = useState(false);

    const { data, isLoading } = apiHooks.position.useSearch(
        {
            filters: {
                user_broker_account_id: id,
            },
        },
        {
            enabled: open, // Only fetch when the modal is open
        }
    );

    const positionsCount = data?.data.pagination.total_items || 0;

    const { mutate: deleteAccount, isPending } = apiHooks.userBrokerAccount.useDelete({
        onSuccess: () => {
            toast.success("Broker Account deleted successfully");
            setOpen(false);
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{renderTrigger()}</DialogTrigger>

            {isLoading ? (
                <DialogPortal>
                    <DialogOverlay />
                    <div className="h-screen w-screen">
                        <LoadingScreen />
                    </div>
                </DialogPortal>
            ) : (
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex-x">Delete Broker Account</DialogTitle>
                        <DialogDescription>Are you sure you want to delete {name}?</DialogDescription>
                    </DialogHeader>

                    {positionsCount > 0 && (
                        <>
                            <p className="text-sm font-medium">
                                <strong>This broker account has {positionsCount} positions associated to it.</strong>
                            </p>

                            <p className="text-sm">
                                If you delete this broker account, these positions will remain, but they will no longer
                                be connected to any broker account.
                            </p>
                        </>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => deleteAccount(id)}
                            loading={isPending}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            )}
        </Dialog>
    );
};

interface EditBrokerAccountModalProps {
    userBrokerAccount: UserBrokerAccount;
    renderTrigger: () => React.ReactNode;
}

const EditBrokerAccountModal: FC<EditBrokerAccountModalProps> = ({ userBrokerAccount, renderTrigger }) => {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState(userBrokerAccount);
    const initialState = useRef(userBrokerAccount);

    const updateField = (field: keyof UserBrokerAccount, value: string) => {
        setState((prev) => ({ ...prev, [field]: value }));
    };

    const { mutate: update, isPending } = apiHooks.userBrokerAccount.useUpdate({
        onSuccess: () => {
            toast.success("Broker Account updated successfully");
            setOpen(false);
        },
        onError: apiErrorHandler,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.name.trim()) return;
        update({ id: userBrokerAccount.id, payload: { name: state.name.trim() } });
    };

    // Reset name when modal opens
    useEffect(() => {
        if (open) setState(userBrokerAccount);
    }, [open, userBrokerAccount]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{renderTrigger()}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Broker Account</DialogTitle>
                    <DialogDescription>Update the name of your broker account.</DialogDescription>
                </DialogHeader>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <WithLabel Label={<Label>Name</Label>}>
                        <Input
                            className="w-full!"
                            placeholder="Account Name"
                            type="text"
                            required
                            maxLength={64}
                            value={state.name}
                            onChange={(e) => updateField("name", e.target.value)}
                        />
                    </WithLabel>
                    <DialogFooter>
                        <Button type="submit" disabled={isEqual(initialState.current, state)} loading={isPending}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
