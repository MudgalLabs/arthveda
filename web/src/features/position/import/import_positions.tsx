import { FC, ReactNode, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import Decimal from "decimal.js";

import { toast } from "@/components/toast";
import { WithLabel } from "@/components/with_label";
import { apiHooks } from "@/hooks/api_hooks";
import { apiErrorHandler } from "@/lib/api";
import {
    Button,
    Input,
    Label,
    Tooltip,
    RadioGroup,
    RadioGroupItem,
    Checkbox,
    DataTable,
    Tag,
    useDocumentTitle,
    IconImport,
    PageHeading,
} from "netra";
import { ImportPositionsResponse } from "@/lib/api/position";
import { CurrencyCode } from "@/lib/api/currency";
import { DecimalString, Setter } from "@/lib/types";
import { DecimalInput } from "@/components/input/decimal_input";
import { IconArrowLeft, IconArrowRight, IconCheck, IconInfo } from "@/components/icons";
import { ROUTES } from "@/constants";
import { MultiStep } from "@/components/multi_step/multi_step";
import { LoadingScreen } from "@/components/loading_screen";
import { Broker, BrokerName } from "@/lib/api/broker";
import { Card } from "@/components/card";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
    Position,
    positionDirectionToString,
    PositionInstrument,
    positionInstrumentToString,
    positionStatusToString,
    UserBrokerAccountSearchValue,
} from "@/features/position/position";
import { MultiStepProps } from "@/components/multi_step/multi_step_context";
import {
    ColumnDef,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/s8ly/data_table/data_table_header";
import { DataTablePagination } from "@/s8ly/data_table/data_table_pagination";
import { useBroker } from "@/features/broker/broker_context";
import { UserBrokerAccountSearch } from "@/features/broker/components/user_broker_account_search";
import { BrokerAccountInfoTooltip } from "@/features/broker/components/broker_account_info_tooltip";
import { ApiRes } from "@/lib/api/client";

interface State {
    brokerID: string;
    userBrokerAccount: UserBrokerAccountSearchValue | null;
    brokerName: BrokerName | null;
    file: File | null;
    currency: CurrencyCode;
    riskAmount: DecimalString;
    // If "fixed", we use the risk amount provided by the user.
    // If "auto", we calculate it based on the trades done in the position's lifecycle.
    chargesCalculationMethod: "manual" | "auto";
    manualChargeAmount: DecimalString;
    force: boolean;
}

const INITIAL_STATE: State = {
    brokerID: "",
    userBrokerAccount: null,
    brokerName: null,
    file: null,
    currency: "inr",
    riskAmount: "",
    chargesCalculationMethod: "auto",
    manualChargeAmount: "0",
    force: false,
};

export const ImportPositions = () => {
    useDocumentTitle("Import positions • Arthveda");
    const [state, setState] = useState<State>(INITIAL_STATE);
    const [importPositionResData, setImportPositionResData] = useState<ImportPositionsResponse | null>(null);

    const discard = useCallback(() => {
        setState(INITIAL_STATE);
        setImportPositionResData(null);
    }, []);

    const navigate = useNavigate();

    const { mutateAsync: importAsync, isPending } = apiHooks.position.useImport({
        onError: (error) => {
            apiErrorHandler(error);
        },
    });

    const handleReviewImport = ({ onSuccess }: { onSuccess?: (data: ImportPositionsResponse) => void }) => {
        if (!state.file || !state.brokerID || !state.userBrokerAccount) return;

        toast.promise(
            importAsync({
                file: state.file,
                broker_id: state.brokerID,
                user_broker_account_id: state.userBrokerAccount.id,
                currency: state.currency,
                risk_amount: state.riskAmount || "0",
                charges_calculation_method: state.chargesCalculationMethod,
                manual_charge_amount: state.manualChargeAmount,
                confirm: false,
                force: false,
            }),
            {
                loading: "Parsing file",
                success: (rawRes: any) => {
                    const res = rawRes.data as ApiRes<ImportPositionsResponse>;
                    onSuccess?.(res.data);

                    if (res.status === "success") {
                        setImportPositionResData(res.data);
                    }

                    return `Found ${res.data.positions_count} positions`;
                },
            }
        );
    };

    const handleStartImport = ({ onSuccess }: { onSuccess?: (data: ImportPositionsResponse) => void }) => {
        if (
            !state.file ||
            !state.brokerID ||
            !state.userBrokerAccount ||
            importPositionResData?.positions?.length === 0
        )
            return;

        toast.promise(
            importAsync({
                file: state.file,
                broker_id: state.brokerID,
                user_broker_account_id: state.userBrokerAccount.id,
                currency: state.currency,
                risk_amount: state.riskAmount,
                charges_calculation_method: state.chargesCalculationMethod,
                manual_charge_amount: state.manualChargeAmount,
                confirm: true,
                force: state.force,
            }),
            {
                loading: "Importing positions",
                success: (res: any) => {
                    const data = res?.data?.data as ImportPositionsResponse;

                    onSuccess?.(data);

                    // Reset the state after import.
                    discard();

                    if (data.positions_imported_count > 0) {
                        return {
                            type: "success",
                            message: `Imported ${data.positions_imported_count} positions`,
                            action: {
                                label: "View Positions",
                                onClick: () => {
                                    navigate(ROUTES.listPositions);
                                },
                            },
                        };
                    } else {
                        return {
                            type: "warning",
                            message: "No new positions to import",
                        };
                    }
                },
            }
        );
    };

    const getNextButtonProps = ({ currentStepId, next }: MultiStepProps) => {
        let onClick = next;
        let loading = isPending;
        let disabled = false;

        if (currentStepId === "broker-step") {
            if (state.brokerID === "") {
                disabled = true;
            }

            if (state.userBrokerAccount === null) {
                disabled = true;
            }
        }

        if (currentStepId === "file-step") {
            if (state.file === null) {
                disabled = true;
            }
        }

        if (currentStepId === "options-step") {
            onClick = () => {
                handleReviewImport({
                    onSuccess: () => {
                        next();
                    },
                });
            };
        }

        if (currentStepId === "review-step") {
            onClick = () => {
                handleStartImport({
                    onSuccess: () => {
                        navigate(ROUTES.dashboard);
                    },
                });
            };
        }

        return {
            onClick,
            loading,
            disabled,
        };
    };

    const getPrevButtonLabel = useCallback((props: MultiStepProps): ReactNode => {
        const { currentStepId } = props;

        let labelText = "Back";

        if (currentStepId === "broker-step") {
            labelText = "";
        }

        if (currentStepId === "file-step") {
            labelText = "Select Broker";
        }

        if (currentStepId === "options-step") {
            labelText = "Upload File";
        }

        if (currentStepId === "review-step") {
            labelText = "Customise Options";
        }

        if (currentStepId === "import-step") {
            labelText = "Review Import";
        }

        return (
            <>
                <IconArrowLeft />
                {labelText}
            </>
        );
    }, []);

    const getNextButtonLabel = useCallback((props: MultiStepProps): ReactNode => {
        const { currentStepId } = props;

        let labelText = "Next";

        if (currentStepId === "broker-step") {
            labelText = "Upload File";
        }

        if (currentStepId === "file-step") {
            labelText = "Customise Options";
        }

        if (currentStepId === "options-step") {
            labelText = "Review Import";
        }

        if (currentStepId === "review-step") {
            labelText = "Start Import";
        }

        return (
            <>
                {labelText}
                <IconArrowRight />
            </>
        );
    }, []);

    return (
        <>
            <PageHeading>
                <IconImport size={18} />
                <h1>Import positions</h1>
            </PageHeading>

            <div className="h-4" />

            <MultiStep.Root>
                <MultiStep.StepperContainer>
                    <MultiStep.Stepper>
                        {({ index, currentStepIndex }) => {
                            return (
                                <div
                                    className={cn("h-2 w-8 rounded-md transition-all", {
                                        "bg-secondary": index > currentStepIndex,
                                        "bg-primary": index <= currentStepIndex,
                                        "w-24": index === currentStepIndex,
                                    })}
                                />
                            );
                        }}
                    </MultiStep.Stepper>
                </MultiStep.StepperContainer>

                <div className="h-8" />

                <MultiStep.Content>
                    <MultiStep.Step id="broker-step">
                        <BrokerStep state={state} setState={setState} />
                    </MultiStep.Step>

                    <MultiStep.Step id="file-step">
                        <FileStep state={state} setState={setState} />
                    </MultiStep.Step>

                    <MultiStep.Step id="options-step">
                        <OptionsStep state={state} setState={setState} />
                    </MultiStep.Step>

                    <MultiStep.Step id="review-step">
                        {importPositionResData !== null && (
                            <ReviewStep
                                state={state}
                                setState={setState}
                                positions={importPositionResData.positions}
                                positionsCount={importPositionResData.positions_count}
                                duplicateCount={importPositionResData.duplicate_positions_count}
                                invalidPositionsCount={importPositionResData.invalid_positions_count}
                                unsupportedPositionsCount={importPositionResData.unsupported_positions_count}
                                fromDate={importPositionResData.from_date}
                                toDate={importPositionResData.from_date}
                            />
                        )}
                    </MultiStep.Step>
                </MultiStep.Content>

                <div className="h-8" />

                <div className="flex w-full justify-between gap-x-4">
                    <MultiStep.PreviousStepButton>
                        {(props) =>
                            props.hasPrevious ? (
                                <Button variant="secondary" onClick={() => props.prev()} disabled={isPending}>
                                    {getPrevButtonLabel(props)}
                                </Button>
                            ) : (
                                <span />
                            )
                        }
                    </MultiStep.PreviousStepButton>

                    <MultiStep.NextStepButton>
                        {(props) => {
                            const buttonProps = getNextButtonProps(props);

                            return (
                                <Tooltip content="Some required fields are missing" disabled={!buttonProps.disabled}>
                                    <Button variant="primary" {...buttonProps}>
                                        {getNextButtonLabel(props)}
                                    </Button>
                                </Tooltip>
                            );
                        }}
                    </MultiStep.NextStepButton>
                </div>
            </MultiStep.Root>
        </>
    );
};

export default ImportPositions;

interface ImportStepProps {
    state: State;
    setState: Setter<State>;
}

const BrokerStep: FC<ImportStepProps> = ({ state, setState }) => {
    const { data, isLoading } = apiHooks.broker.useList();
    const brokers = data?.data || [];

    const { getBrokerLogoByName } = useBroker();

    if (isLoading) {
        return <LoadingScreen />;
    }

    const handleClick = (broker: Broker) => {
        setState((prev) => {
            // Toggle it if the same broker is clicked again.
            const nextBrokerID = prev.brokerID === broker.id ? "" : broker.id;

            let nextBrokerName = null;

            if (nextBrokerID !== "") {
                nextBrokerName = broker.name as BrokerName;
            }

            return {
                ...prev,
                brokerID: nextBrokerID,
                brokerName: nextBrokerName,
                userBrokerAccount: null, // Reset the user broker account when changing broker.
            };
        });
    };

    return (
        <>
            <h2 className="sub-heading">Broker</h2>
            <p className="label-muted">
                Select the Broker and the Broker Account you want to link these imported positions to
            </p>

            <div className="h-8" />

            <ul className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
                {brokers
                    .filter((b) => b.supports_file_import)
                    .map((broker) => {
                        const isSelected = state.brokerID === broker.id;
                        return (
                            <li key={broker.id}>
                                <BrokerTile
                                    key={broker.id}
                                    name={broker.name as BrokerName}
                                    image={getBrokerLogoByName(broker.name as BrokerName)}
                                    isSelected={isSelected}
                                    onClick={() => handleClick(broker)}
                                />
                            </li>
                        );
                    })}
            </ul>

            <div className="h-8" />

            <WithLabel
                Label={
                    <div className="flex-x">
                        <Label>Broker Account</Label>
                        <BrokerAccountInfoTooltip />
                    </div>
                }
            >
                <Tooltip content="Select a broker first" contentProps={{ side: "bottom" }} disabled={!!state.brokerID}>
                    <UserBrokerAccountSearch
                        filters={{
                            brokerId: state.brokerID,
                        }}
                        disabled={!state.brokerID}
                        value={state.userBrokerAccount}
                        onChange={(v) => {
                            if (v) {
                                setState((prev) => ({
                                    ...prev,
                                    userBrokerAccount: v,
                                }));
                            }
                        }}
                    />
                </Tooltip>
            </WithLabel>
        </>
    );
};

const BrokerTile = ({
    className,
    name,
    image,
    onClick,
    isSelected,
}: {
    className?: string;
    name: BrokerName;
    image: string;
    onClick: () => void;
    isSelected: boolean;
}) => {
    return (
        // Remove min-w from button, grid will handle it
        <button onClick={onClick} className="w-full">
            <Card
                className={cn(
                    "flex-center hover:border-border-hover relative gap-x-2 border-1 p-8 transition-all duration-300 ease-in-out",
                    {
                        "border-border-accent hover:border-border-accent": isSelected,
                    },
                    className
                )}
            >
                <img src={image} alt={`${name} logo`} className="h-10" />
                <p
                    className={cn("heading text-surface-foreground font-medium", {
                        "text-foreground": isSelected,
                    })}
                >
                    {name}
                </p>

                <div
                    className={cn(
                        "bg-primary text-foreground flex-center absolute top-1 right-1 rounded-full transition-opacity",
                        {
                            "opacity-0": !isSelected,
                            "opacity-100": isSelected,
                        }
                    )}
                >
                    <IconCheck size={22} />
                </div>
            </Card>
        </button>
    );
};

const AngelOneTradingHistoryDirections: FC = () => {
    return (
        <>
            <li>
                Go to the <strong>Account </strong> section on the App
            </li>
            <li>
                Go to <strong>Trades</strong> and charges
            </li>
            <li>Click on Download trade history</li>
        </>
    );
};

const GrowwTradingHistoryDirections: FC = () => {
    return (
        <>
            <li>Go to your profile</li>
            <li>
                Select the <strong>Reports</strong> option
            </li>
            <li>
                Under <strong>Transactions</strong>, choose <strong>Stock Order History</strong>
            </li>
            <li>
                Select the time frame and click <strong>Download</strong>
            </li>
            <li>Upload your Excel file below (You will be able to review the import before it is saved)</li>
        </>
    );
};

const KotakSecuritiesTradingHistoryDirections: FC = () => {
    return (
        <>
            <li>Log into your Global investing account</li>
            <li>
                Click on <strong>Performance & Reports</strong>
            </li>
            <li>
                Download required reports / statements from the <strong>Reports</strong> section.
            </li>
        </>
    );
};

const UpstoxTradingHistoryDirections: FC = () => {
    return (
        <>
            <li>
                Login to your Upstox account and go to{" "}
                <a
                    className="text-base!"
                    href="https://account.upstox.com/reports"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Reports
                </a>
            </li>
            <li>
                Scroll down and click on <strong>Trade</strong>
            </li>
            <li>
                Set appropriate filters and click <strong>Get report</strong> button
            </li>
            <li>
                Click <strong>Download XLSX</strong> from download dropdown to download the Excel file
            </li>
            <li>Upload your Excel file below (You will be able to review the import before it is saved)</li>
        </>
    );
};

const ZerodhaTradingHistoryDirections: FC = () => {
    return (
        <>
            <li>
                Login to your{" "}
                <a className="text-base!" href="https://console.zerodha.com" target="_blank" rel="noopener noreferrer">
                    Zerodha
                </a>{" "}
                console account
            </li>
            <li>
                Navigate to <strong>Reports </strong> and select <strong>Tradebook</strong>
            </li>
            <li>Select the necessary filters and click submit button</li>
            <li>
                Click <strong>XLSX </strong> to download the Excel file
            </li>
            <li>Upload your Excel file below (You will be able to review the import before it is saved)</li>
        </>
    );
};

const FileStep: FC<ImportStepProps> = ({ state, setState }) => {
    // If broker is not selected, we don't show the file upload step.
    if (state.brokerName === null || state.brokerID === "") {
        return <p className="text-text-destructive">You need to select a Broker first before performing this step.</p>;
    }

    const { getBrokerLogoByName } = useBroker();

    const name = state.brokerName;
    // const logo = getBrokerLogo(state.brokerName);
    const logo = getBrokerLogoByName(state.brokerName);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];

        setState((prev) => ({
            ...prev,
            file: selectedFile ?? null,
        }));
    };

    return (
        <>
            <h2 className="sub-heading">File</h2>
            <p className="label-muted">Upload the trading history excel file</p>

            <div className="h-8" />

            <div className="flex items-center gap-x-2">
                <img src={logo} alt={`${name} logo`} className="h-10" />

                <span className="heading text-foreground font-medium">{name}</span>
            </div>

            <div className="h-4" />

            <p className="text-foreground-muted">
                Follow the directions below to upload your trading history through {name}
            </p>

            <div className="h-2" />

            <ol className="list-decimal space-y-1 pl-8">
                {name === "Angel One" ? (
                    <AngelOneTradingHistoryDirections />
                ) : name === "Groww" ? (
                    <GrowwTradingHistoryDirections />
                ) : name === "Kotak Securities" ? (
                    <KotakSecuritiesTradingHistoryDirections />
                ) : name === "Upstox" ? (
                    <UpstoxTradingHistoryDirections />
                ) : name === "Zerodha" ? (
                    <ZerodhaTradingHistoryDirections />
                ) : (
                    <p className="text-text-destructive">Unsupported broker for file import</p>
                )}
            </ol>

            <div className="h-8" />

            <Input
                type="file"
                onChange={handleFileChange}
                accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            />
        </>
    );
};

const OptionsStep: FC<ImportStepProps> = ({ state, setState }) => {
    const brokerName = state.brokerName;

    const supportedInstrumentsByBroker: Record<BrokerName, PositionInstrument[]> = {
        "Angel One": ["equity"],
        Groww: ["equity"],
        "Kotak Securities": ["equity", "option"],
        Upstox: ["equity", "option"],
        Zerodha: ["equity", "future", "option"],
    };

    return (
        <>
            <h2 className="sub-heading">Options</h2>
            <p className="label-muted">Customize how your positions are imported</p>

            <div className="h-8" />

            <div className="flex flex-col gap-x-16 gap-y-8 sm:flex-row">
                <WithLabel Label={<Label>Instruments supported</Label>}>
                    {brokerName && (
                        <span className="flex-x">
                            {supportedInstrumentsByBroker[brokerName]?.map((instrument) => (
                                <Tag key={instrument}>{positionInstrumentToString(instrument)}</Tag>
                            ))}
                        </span>
                    )}
                </WithLabel>

                <WithLabel
                    Label={
                        <div className="flex items-center gap-x-2">
                            <Label>Risk per position</Label>
                            <Tooltip
                                content={
                                    <div>
                                        <p>
                                            Amount you risked on each position. This will be used to calculate R Factor
                                            for each position.
                                        </p>
                                    </div>
                                }
                            >
                                <IconInfo size={14} />
                            </Tooltip>
                        </div>
                    }
                >
                    <DecimalInput
                        kind="amount"
                        currency={state.currency}
                        value={state.riskAmount}
                        onChange={(e) =>
                            setState((prev) => ({
                                ...prev,
                                riskAmount: e.target.value,
                            }))
                        }
                    />
                </WithLabel>

                <WithLabel
                    Label={
                        <div className="flex items-center gap-x-2">
                            <Label>Charges per trade</Label>
                            <Tooltip
                                content={
                                    <div>
                                        <p>
                                            For Auto, we calculate a close approximate charge for every trade in the
                                            position. Includes brokerage, taxes, and other charges like STT, DP Charges,
                                            GST, etc.
                                        </p>
                                        <br />
                                        <p>
                                            For Manual, you can set a charge amount that will be applied to every trade
                                            in the position.
                                        </p>
                                    </div>
                                }
                            >
                                <IconInfo size={14} />
                            </Tooltip>
                        </div>
                    }
                >
                    <div className="space-y-2">
                        <RadioGroup
                            value={state.chargesCalculationMethod}
                            onValueChange={(v) =>
                                setState((prev) => ({
                                    ...prev,
                                    chargesCalculationMethod: v as "manual" | "auto",
                                }))
                            }
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="auto" id="auto" />
                                <Label htmlFor="auto">Auto</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="manual" id="manual" />
                                <Label htmlFor="manual">Manual</Label>
                            </div>
                        </RadioGroup>

                        {state.chargesCalculationMethod === "manual" && (
                            <DecimalInput
                                kind="amount"
                                currency={state.currency}
                                value={state.manualChargeAmount}
                                onChange={(e) =>
                                    setState((prev) => ({
                                        ...prev,
                                        manualChargeAmount: e.target.value,
                                    }))
                                }
                            />
                        )}
                    </div>
                </WithLabel>
            </div>
        </>
    );
};

interface ReviewStepProps extends ImportStepProps {
    positions: Position[];
    positionsCount: number;
    duplicateCount: number;
    invalidPositionsCount: number;
    unsupportedPositionsCount: number;
    fromDate: string;
    toDate: string;
}

const ReviewStep: FC<ReviewStepProps> = ({
    positions,
    positionsCount,
    duplicateCount,
    invalidPositionsCount,
    unsupportedPositionsCount,
    state,
    setState,
}) => {
    return (
        <>
            <h2 className="sub-heading">Review</h2>
            <p className="label-muted">Review the positions before importing</p>

            <div className="h-4" />

            <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-row sm:flex-wrap">
                <div className="min-w-0 flex-1">
                    <p className="label-muted">Total Positions</p>
                    <p className="heading">{positionsCount}</p>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex-x">
                        <p className="label-muted">Duplicate Positions </p>
                        <Tooltip content="These positions already exist in your account and will not be imported unless you enable 'Force Import'.">
                            <IconInfo />
                        </Tooltip>
                    </div>
                    <p className="heading">{duplicateCount}</p>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex-x">
                        <p className="label-muted">Invalid Positions </p>
                        <Tooltip content="These positions have been ignored because they have incorrect data like selling/buying more quanity than you have open. It could have be that some trades are missing for the position.">
                            <IconInfo />
                        </Tooltip>
                    </div>
                    <p className="heading">{invalidPositionsCount}</p>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex-x">
                        <p className="label-muted">Unsupported Positions </p>
                        <Tooltip content="These positions have been ignored because they belong to an Instrument that Arthveda doesn't support importing yet for the selected Broker.">
                            <IconInfo />
                        </Tooltip>
                    </div>
                    <p className="heading">{unsupportedPositionsCount}</p>
                </div>

                <div
                    className={cn("min-w-0 flex-1", {
                        "opacity-0": !duplicateCount,
                        "opacity-100": duplicateCount > 0,
                    })}
                >
                    <div className="flex-x">
                        <Label className="label-muted" htmlFor="force">
                            Force Import
                        </Label>

                        <Tooltip content="If enabled, duplicate positions will be imported as well. This can be slow for large files.">
                            <IconInfo />
                        </Tooltip>
                    </div>

                    {/* Adding h-1 margin to match the position with the rest of the row. */}
                    <div className="h-1" />

                    <Checkbox
                        id="force"
                        checked={state.force}
                        onCheckedChange={() => setState((prev) => ({ ...prev, force: !prev.force }))}
                    />
                </div>
            </div>

            <div className="h-4" />

            <ImportPositionsTable positions={positions} />
        </>
    );
};

// TODO: A lot of copy paste here from PositionListTable.
// Maybe refactor <DataTableSmart /> by adding 1 prop called `useReactTableProps` which will
// make it easy to use the same columns def with DataTableSmart in both places? I'm not too sure.
const columns: ColumnDef<Position>[] = [
    {
        id: "opened",
        meta: {
            columnVisibilityHeader: "Opened At",
        },
        accessorKey: "opened_at",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Opened At" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => formatDate(new Date(row.original.opened_at), { time: true }),
        enableSorting: true,
    },
    {
        id: "symbol",
        meta: {
            columnVisibilityHeader: "Symbol",
        },
        accessorKey: "symbol",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Symbol" column={column} disabled={table.options.meta?.isFetching} />
        ),
        enableSorting: false,
    },
    {
        id: "instrument",
        meta: {
            columnVisibilityHeader: "Instrument",
        },
        accessorKey: "instrument",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Instrument" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => positionInstrumentToString(row.original.instrument),
    },
    {
        id: "direction",
        meta: {
            columnVisibilityHeader: "Direction",
        },
        accessorKey: "direction",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Direction" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => positionDirectionToString(row.original.direction),
        enableSorting: false,
    },
    {
        id: "status",
        meta: {
            columnVisibilityHeader: "Status",
        },
        accessorKey: "status",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Status" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => positionStatusToString(row.original.status),
        enableSorting: false,
    },
    {
        id: "r_factor",
        meta: {
            columnVisibilityHeader: "R Factor",
        },
        accessorKey: "r_factor",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="R Factor" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => new Decimal(row.original.r_factor).toFixed(2).toString(),
        enableSorting: false,
    },
    {
        id: "gross_pnl",
        meta: {
            columnVisibilityHeader: "Gross PnL",
        },
        accessorKey: "gross_pnl_amount",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Gross PnL" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) =>
            formatCurrency(row.original.gross_pnl_amount, {
                currency: row.original.currency,
            }),
        enableSorting: false,
    },
    {
        id: "net_pnl",
        meta: {
            columnVisibilityHeader: "Net PnL",
        },
        accessorKey: "net_pnl_amount",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Net PnL" column={column} disabled={table.options.meta?.isFetching} />
        ),
        cell: ({ row }) => (
            <span
                className={
                    new Decimal(row.original.net_pnl_amount).isNegative()
                        ? "text-text-destructive"
                        : "text-text-success"
                }
            >
                {formatCurrency(row.original.net_pnl_amount, {
                    currency: row.original.currency,
                })}
            </span>
        ),
        enableSorting: false,
    },
    {
        id: "total_charges_amount",
        meta: {
            columnVisibilityHeader: "Charges",
        },
        accessorKey: "total_charges_amount",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Charges" disabled={table.options.meta?.isFetching} column={column} />
        ),
        cell: ({ row }) =>
            formatCurrency(row.original.total_charges_amount, {
                currency: row.original.currency,
            }),
        enableSorting: false,
    },
    {
        id: "net_return_percentage",
        meta: {
            columnVisibilityHeader: "Net Return %",
        },
        accessorKey: "net_return_percentage",
        header: ({ column, table }) => (
            <DataTableColumnHeader title="Net Return %" disabled={table.options.meta?.isFetching} column={column} />
        ),
        cell: ({ row }) => `${Number(row.original.net_return_percentage).toFixed(2)}%`,
        enableSorting: false,
    },
];

const ImportPositionsTable = ({ positions }: { positions: Position[] }) => {
    const table = useReactTable({
        data: positions,
        columns,
        initialState: {
            sorting: [{ id: "opened", desc: true }],
        },
        getCoreRowModel: getCoreRowModel(),
        rowCount: positions.length,
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSortingRemoval: false,
    });

    return (
        <>
            <DataTable table={table} />

            <div className="h-4" />

            <DataTablePagination table={table} total={positions.length} />
        </>
    );
};
