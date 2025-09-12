import { FC, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import isEqual from "lodash/isEqual";

import { BrokerLogo } from "@/components/broker_logo";
import {
    IconArrowUpRight,
    IconBadgeAlert,
    IconBadgeInfo,
    IconEdit,
    IconEllipsis,
    IconInfo,
    IconPlus,
    IconSync,
    IconTrash,
} from "@/components/icons";
import { LoadingScreen } from "@/components/loading_screen";
import { PageHeading } from "@/components/page_heading";
import { useBroker } from "@/features/broker/broker_context";
import { apiHooks } from "@/hooks/api_hooks";
import {
    ConnectUserBrokerAccountResult,
    SyncUserBrokerAccountResult,
    UserBrokerAccount,
} from "@/lib/api/user_broker_account";
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
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    Alert,
    AlertTitle,
    AlertDescription,
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
    Tag,
    useDocumentTitle,
    IconZap,
    Loading,
} from "netra";
import { WithLabel } from "@/components/with_label";
import { BrokerSelect } from "@/components/select/broker_select";
import { toast } from "@/components/toast";
import { apiErrorHandler } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { BrokerName } from "@/lib/api/broker";
import { PasswordInput } from "@/components/input/password_input";
import { Setter } from "@/lib/types";
import { Position } from "@/features/position/position";
import { Link } from "@/components/link";
import { ROUTES } from "@/constants";

export const BrokerAccounts = () => {
    useDocumentTitle("Broker accounts • Arthveda");
    const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
    const [syncSummaryModalOpen, setSyncSummaryModalOpen] = useState(false);
    const { isFetching } = apiHooks.userBrokerAccount.useList();

    return (
        <>
            <PageHeading>
                <IconZap size={18} />
                <h1>Broker accounts</h1>
                {isFetching && <Loading />}
            </PageHeading>

            <div className="mb-4 flex justify-end">
                <AddBrokerAccountModal
                    renderTrigger={() => (
                        <Button className="">
                            <IconPlus size={16} /> Broker account
                        </Button>
                    )}
                />
            </div>

            <BrokerAccountsTable setSyncSummary={setSyncSummary} setSyncSummaryModalOpen={setSyncSummaryModalOpen} />

            <SyncSummaryModal syncSummary={syncSummary} open={syncSummaryModalOpen} setOpen={setSyncSummaryModalOpen} />
        </>
    );
};

export default BrokerAccounts;

interface SyncSummary {
    BrokerName: BrokerName;
    BrokerAccountName: string;
    NewPositionsCount: number;
    UpdatedPositionsCount: number;
    PositionsData: Position[];
}

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
        accessorKey: "last_sync_at",
        header: ({ column }) => <DataTableColumnHeader title="Last Sync" column={column} />,
        cell: ({ row }) => {
            if (row.original.last_sync_at === null) {
                return "Never";
            }

            const date = new Date(row.original.last_sync_at);
            return formatDate(date, { time: true });
        },
        enableHiding: false,
        enableSorting: false,
    },
    // {
    //     accessorKey: "is_connected",
    //     header: ({ column }) => (
    //         <DataTableColumnHeader
    //             title={
    //                 <Tooltip content="You connect your broker account via OAuth to sync positions from your broker.">
    //                     <span className="flex-x">
    //                         OAuth Connect <IconInfo />
    //                     </span>
    //                 </Tooltip>
    //             }
    //             column={column}
    //         />
    //     ),
    //     cell: ({ row }) => {
    //         const { getBrokerById } = useBroker();
    //         const broker = getBrokerById(row.original.broker_id);

    //         if (!broker) {
    //             return "";
    //         }

    //         if (row.original.is_connected) {
    //             return (
    //                 <span className="flex-x">
    //                     <IconBadgeCheck size={16} className="text-success-foreground" /> Connected
    //                 </span>
    //             );
    //         }

    //         return (
    //             <span className="flex-x">
    //                 <IconBadgeAlert size={16} className="text-text-destructive" /> Not connected
    //             </span>
    //         );
    //     },
    //     enableHiding: false,
    //     enableSorting: false,
    // },
    {
        accessorKey: "is_authenticated",
        header: ({ column }) => (
            <DataTableColumnHeader
                title={
                    <span className="flex-x">
                        Sync
                        <Tooltip content="For security reasons, brokers requires users to login everyday to grant access.">
                            <IconInfo />
                        </Tooltip>
                    </span>
                }
                column={column}
            />
        ),
        cell: ({ row, table }) => {
            const { getBrokerById, getBrokerLogoById } = useBroker();
            const broker = getBrokerById(row.original.broker_id);
            const setSyncSummary = table.options.meta?.extra?.setSyncSummary;
            const setSyncSummaryModalOpen = table.options.meta?.extra?.setSyncSummaryModalOpen;

            const { mutate: sync, isPending: isSyncing } = apiHooks.userBrokerAccount.useSync({
                onSuccess: (res) => {
                    const data = res.data.data as SyncUserBrokerAccountResult;

                    if (data.login_required && data.login_url) {
                        window.location.assign(data.login_url!);
                        return;
                    }

                    if (setSyncSummary && setSyncSummaryModalOpen) {
                        setSyncSummary({
                            BrokerName: broker?.name,
                            BrokerAccountName: row.original.name,
                            NewPositionsCount: data.positions_imported_count - data.forced_positions_count,
                            UpdatedPositionsCount: data.forced_positions_count,
                            PositionsData: data.positions,
                        });
                        setSyncSummaryModalOpen(true);
                    }

                    toast.success(`${row.original.name} synced successfully`);
                },
                onError: apiErrorHandler,
            });

            if (!broker) {
                return "";
            }

            if (broker.name !== "Zerodha") {
                return (
                    <span className="flex-x">
                        <IconBadgeAlert size={16} className="text-text-warning" /> Broker not supported
                    </span>
                );
            }

            if (!row.original.is_authenticated) {
                return (
                    <Button variant="secondary" onClick={() => sync(row.original.id)} loading={isSyncing}>
                        <img
                            src={getBrokerLogoById(row.original.broker_id)}
                            alt={broker.name}
                            className="mr-2 h-4 w-4"
                        />
                        Connect
                    </Button>
                );
            }

            return (
                <Button variant="secondary" onClick={() => sync(row.original.id)} loading={isSyncing}>
                    <IconSync size={16} />
                    Sync
                </Button>
            );
        },
        enableHiding: false,
        enableSorting: false,
    },
    {
        id: "actions",
        header: ({ column }) => <DataTableColumnHeader title="Actions" column={column} />,
        cell: ({
            // table,
            row,
        }) => {
            // const setSyncSummary = table.options.meta?.extra?.setSyncSummary;
            // const setSyncSummaryModalOpen = table.options.meta?.extra?.setSyncSummaryModalOpen;

            const {
                getBrokerById,
                getBrokerLogoById,
                // getBrokerNameById
            } = useBroker();
            const broker = getBrokerById(row.original.broker_id);
            // const brokerName = getBrokerNameById(row.original.broker_id);

            // const { mutate: sync, isPending: isSyncing } = apiHooks.userBrokerAccount.useSync({
            //     onSuccess: (res) => {
            //         const data = res.data.data as SyncUserBrokerAccountResult;

            //         if (data.login_required && data.login_url) {
            //             toast.warning("Broker login has expired", {
            //                 duration: 10000,
            //                 description: "Login to your broker account",
            //                 action: {
            //                     label: "Login",
            //                     onClick: () => {
            //                         window.location.assign(data.login_url!);
            //                     },
            //                 },
            //             });
            //             return;
            //         }

            //         if (setSyncSummary && setSyncSummaryModalOpen) {
            //             setSyncSummary({
            //                 BrokerName: brokerName,
            //                 BrokerAccountName: row.original.name,
            //                 NewPositionsCount: data.positions_imported_count - data.forced_positions_count,
            //                 UpdatedPositionsCount: data.forced_positions_count,
            //                 PositionsData: data.positions,
            //             });
            //             setSyncSummaryModalOpen(true);
            //         }

            //         toast.success(`${row.original.name} synced successfully`);
            //     },
            //     onError: apiErrorHandler,
            // });

            if (!broker) {
                return null;
            }

            const [editOpen, setEditOpen] = useState(false);
            const [deleteOpen, setDeleteOpen] = useState(false);
            const [connectOpen, setConnectOpen] = useState(false);
            const [disconnectOpen, setDisconnectOpen] = useState(false);
            const [dropdownOpen, setDropdownOpen] = useState(false);

            const handleEditOpen = () => {
                setDropdownOpen(false);
                setEditOpen(true);
            };

            const handleDeleteOpen = () => {
                setDropdownOpen(false);
                setDeleteOpen(true);
            };

            // const handleConnectOpen = () => {
            //     setDropdownOpen(false);
            //     setConnectOpen(true);
            // };

            const handleDisconnectOpen = () => {
                setDropdownOpen(false);
                setDisconnectOpen(true);
            };

            return (
                <>
                    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <IconEllipsis size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="flex w-35 flex-col">
                            {/* <Tooltip content="Broker must be connected to sync" disabled={row.original.is_connected}>
                                <DropdownMenuItem asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full! justify-start"
                                        onClick={() => sync(row.original.id)}
                                        disabled={isSyncing || !row.original.is_connected}
                                    >
                                        <IconSync size={16} />
                                        Sync
                                    </Button>
                                </DropdownMenuItem>
                            </Tooltip>

                            <Tooltip
                                content="Connect is not supported for this broker"
                                disabled={broker.supports_trade_sync}
                            >
                                <DropdownMenuItem asChild>
                                    {!row.original.is_connected ? (
                                        <Button
                                            variant="ghost"
                                            className="w-full! justify-start"
                                            onClick={handleConnectOpen}
                                            disabled={!broker.supports_trade_sync}
                                        >
                                            <IconPlug size={16} />
                                            Connect
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            className="w-full! justify-start"
                                            onClick={handleDisconnectOpen}
                                        >
                                            <IconPlug size={16} />
                                            Disconnect
                                        </Button>
                                    )}
                                </DropdownMenuItem>
                            </Tooltip> */}

                            {row.original.is_connected && (
                                <Tooltip
                                    content="Connect is not supported for this broker"
                                    disabled={broker.supports_trade_sync}
                                >
                                    <DropdownMenuItem asChild>
                                        <Button
                                            variant="ghost"
                                            className="w-full! justify-start"
                                            onClick={handleDisconnectOpen}
                                            disabled={!row.original.is_authenticated}
                                        >
                                            <img
                                                src={getBrokerLogoById(row.original.broker_id)}
                                                alt={broker.name}
                                                className="mr-2 h-4 w-4"
                                            />
                                            Disconnect
                                        </Button>
                                    </DropdownMenuItem>
                                </Tooltip>
                            )}

                            <DropdownMenuItem asChild>
                                <Button variant="ghost" className="w-full! justify-start" onClick={handleEditOpen}>
                                    <IconEdit size={16} />
                                    Edit
                                </Button>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Button variant="ghost" className="w-full! justify-start" onClick={handleDeleteOpen}>
                                    <IconTrash size={16} />
                                    Delete
                                </Button>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <EditBrokerAccountModal userBrokerAccount={row.original} open={editOpen} setOpen={setEditOpen} />

                    <DeleteBrokerAccountModal
                        id={row.original.id}
                        name={row.original.name}
                        open={deleteOpen}
                        setOpen={setDeleteOpen}
                    />

                    <ConnectBrokerAccountModal
                        userBrokerAccount={row.original}
                        open={connectOpen}
                        setOpen={setConnectOpen}
                    />

                    <DisconnectBrokerAccountModal
                        id={row.original.id}
                        name={row.original.name}
                        open={disconnectOpen}
                        setOpen={setDisconnectOpen}
                    />
                </>
            );
        },
        enableHiding: false,
        enableSorting: false,
    },
];

const BrokerAccountsTable = ({
    setSyncSummary,
    setSyncSummaryModalOpen,
}: {
    setSyncSummary: Setter<SyncSummary | null>;
    setSyncSummaryModalOpen: Setter<boolean>;
}) => {
    const { data, isLoading, isError } = apiHooks.userBrokerAccount.useList();

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (isError || !data) {
        return <p className="text-text-destructive">Failed to fetch broker accounts</p>;
    }

    return (
        <DataTableSmart data={data.data} columns={columns} extra={{ setSyncSummary, setSyncSummaryModalOpen }}>
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

    const disableCreate = !name.trim() || !brokerId;

    useEffect(() => {
        if (open) {
            setName("");
            setBrokerId("");
        }
    }, [open]);

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
                        <Tooltip content="Some required fields are missing" disabled={!disableCreate}>
                            <Button type="submit" disabled={disableCreate} loading={isPending}>
                                Create
                            </Button>
                        </Tooltip>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

interface DeleteBrokerAccountModalProps {
    id: string;
    name: string;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const DeleteBrokerAccountModal: FC<DeleteBrokerAccountModalProps> = ({ id, name, open, setOpen }) => {
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
    open: boolean;
    setOpen: (open: boolean) => void;
}

const EditBrokerAccountModal: FC<EditBrokerAccountModalProps> = ({ userBrokerAccount, open, setOpen }) => {
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

interface ConnectBrokerAccountModalProps {
    userBrokerAccount: UserBrokerAccount;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const ConnectBrokerAccountModal: FC<ConnectBrokerAccountModalProps> = ({ userBrokerAccount, open, setOpen }) => {
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");

    const { mutate: connect, isPending: isConnecting } = apiHooks.userBrokerAccount.useConnect({
        onSuccess: (res) => {
            const data = res.data.data as ConnectUserBrokerAccountResult;
            const url = data.login_url;
            window.location.assign(url);
        },
        onError: apiErrorHandler,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId.trim() || !clientSecret.trim()) return;
        connect({
            id: userBrokerAccount.id,
            payload: {
                client_id: clientId.trim(),
                client_secret: clientSecret.trim(),
            },
        });
    };

    useEffect(() => {
        if (open) {
            setClientId("");
            setClientSecret("");
        }
    }, [open]);

    const { getBrokerNameById } = useBroker();
    const brokerName = getBrokerNameById(userBrokerAccount.broker_id);

    if (!brokerName) {
        return null;
    }

    const disableSave = !clientId.trim() || !clientSecret.trim();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Connect Broker Account</DialogTitle>
                    <DialogDescription>
                        Connect {userBrokerAccount.name} to {getBrokerNameById(userBrokerAccount.broker_id)} via OAuth
                    </DialogDescription>
                </DialogHeader>

                <Alert>
                    <IconBadgeInfo />
                    <AlertTitle>Heads up!</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc">
                            <li>
                                <span>
                                    <a
                                        href="https://github.com/MudgalLabs/arthveda"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Arthveda
                                    </a>{" "}
                                    uses your OAuth app only to access and sync your trading positions. It does{" "}
                                    <strong>not</strong> use it for any other purpose.
                                </span>
                            </li>

                            <li>
                                <span>
                                    For security reasons, your OAuth credentials are not visible once saved. If you ever
                                    need to update them, you'll need to <strong>disconnect and reconnect</strong> the
                                    broker account.
                                </span>
                            </li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <ConnectBrokerAccountOAuthSteps brokerName={brokerName} />

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <WithLabel Label={<Label>Client ID</Label>}>
                        <Input
                            className="w-full!"
                            placeholder="Paste your client ID / API key"
                            type="text"
                            required
                            autoComplete="new-password"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                        />
                    </WithLabel>

                    <WithLabel Label={<Label>Client Secret</Label>}>
                        <PasswordInput
                            className="w-full!"
                            placeholder="Paste your client secret / API secret"
                            required
                            autoComplete="new-password"
                            value={clientSecret}
                            onChange={(e) => setClientSecret(e.target.value)}
                        />
                    </WithLabel>

                    <DialogFooter>
                        <Tooltip content="Some required fields are missing" disabled={!disableSave}>
                            <Button type="submit" disabled={disableSave} loading={isConnecting}>
                                Connect
                            </Button>
                        </Tooltip>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const ConnectBrokerAccountOAuthSteps = ({ brokerName }: { brokerName: BrokerName }) => {
    const renderSteps = () => {
        switch (brokerName) {
            case "Zerodha":
                return (
                    <ul className="list-disc">
                        <li>
                            <span>
                                Go to{" "}
                                <a href="https://developers.kite.trade" target="_blank" rel="noopener noreferrer">
                                    Kite Connect developer portal
                                </a>{" "}
                                and create a new app.
                            </span>
                        </li>
                        <li>
                            <span>
                                Set the Redirect URL to:
                                <br />
                                <span className="text-link select-text!">
                                    https://api.arthveda.app/v1/brokers/zerodha/redirect
                                </span>
                                <br />
                                <span className="text-xs">(Arthveda won’t be able to connect without this.)</span>
                            </span>
                        </li>
                        <li>
                            <span>
                                Copy the API Key (Client ID) and API Secret (Client Secret) from the app dashboard and
                                paste them below.
                            </span>
                        </li>
                    </ul>
                );
            default:
                null;
        }

        return null;
    };

    return (
        <Alert>
            <IconBadgeInfo />
            <AlertTitle>Steps to create your OAuth app</AlertTitle>
            <AlertDescription>{renderSteps()}</AlertDescription>
        </Alert>
    );
};

interface DisconnectBrokerAccountModalProps {
    id: string;
    name: string;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const DisconnectBrokerAccountModal: FC<DisconnectBrokerAccountModalProps> = ({ id, name, open, setOpen }) => {
    const { mutate: disconnect, isPending: isDisconnecting } = apiHooks.userBrokerAccount.useDisconnect({
        onSuccess: () => {
            toast.success(`${name} disconnected successfully`);
            setOpen(false);
        },
        onError: apiErrorHandler,
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex-x">Disconnect Broker Account</DialogTitle>
                    <DialogDescription>Are you sure you want to disconnect {name}?</DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => disconnect(id)}
                        loading={isDisconnecting}
                    >
                        Disconnect
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

interface SyncSummaryModalProps {
    syncSummary: SyncSummary | null;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const SyncSummaryModal: FC<SyncSummaryModalProps> = ({ syncSummary, open, setOpen }) => {
    if (!syncSummary) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Sync Complete</DialogTitle>
                    <DialogDescription>
                        Synced positions to {syncSummary.BrokerAccountName} from {syncSummary.BrokerName}
                    </DialogDescription>
                </DialogHeader>

                <div>
                    {syncSummary.PositionsData.length === 0 ? (
                        <p className="text-sm">No new trades found to sync.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <DataTableColumnHeader title="Symbol" />
                                    </TableHead>
                                    <TableHead>
                                        <DataTableColumnHeader title="Opened At" />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {syncSummary.PositionsData.map((position) => (
                                    <TableRow key={position.id}>
                                        <TableCell className="flex-x gap-x-4">
                                            <Link to={ROUTES.viewPosition(position.id)} target="_blank">
                                                <span className="flex-x">
                                                    {position.symbol} <IconArrowUpRight />{" "}
                                                </span>
                                            </Link>

                                            {!position.is_duplicate && <Tag size="small">New</Tag>}
                                        </TableCell>
                                        <TableCell>{formatDate(new Date(position.opened_at))}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={() => setOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
