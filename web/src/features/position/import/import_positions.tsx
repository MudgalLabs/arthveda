import { FC, ReactNode, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { PageHeading } from "@/components/page_heading";
import { toast } from "@/components/toast";
import { WithLabel } from "@/components/with_label";
import { apiHooks } from "@/hooks/api_hooks";
import { apiErrorHandler } from "@/lib/api";
import { Button, Input, Label, Tooltip, RadioGroup, RadioGroupItem } from "@/s8ly";
import { PositionListTable } from "@/features/position/components/position_list_table";
import { ImportPositionsResponse } from "@/lib/api/position";
import { CurrencyCode } from "@/lib/api/currency";
import { DecimalString, Setter } from "@/lib/types";
import { DecimalInput } from "@/components/input/decimal_input";
import { IconArrowLeft, IconArrowRight, IconCheck, IconInfo } from "@/components/icons";
import { ROUTES } from "@/routes_constants";
import { MultiStep } from "@/components/multi_step/multi_step";
import { LoadingScreen } from "@/components/loading_screen";
import { Broker, BrokerName } from "@/lib/api/broker";
import { Card } from "@/components/card";

const INITIAL_STATE: State = {
    brokerID: "",
    brokerName: null,
    file: null,
    instrument: "equity",
    currency: "inr",
    riskAmount: "0",
    chargesCalculationMethod: "auto",
    chargesAmount: "0",
};

export const ImportPositions = () => {
    const [state, setState] = useState<State>(INITIAL_STATE);
    const [importPositionResData, setImportPositionResData] = useState<ImportPositionsResponse | null>(null);

    const discard = useCallback(() => {
        setState(INITIAL_STATE);
        setImportPositionResData(null);
    }, []);

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { mutateAsync, isPending } = apiHooks.position.useImport({
        onError: (error) => {
            apiErrorHandler(error);
        },
    });

    const handleStartImport = ({ onSuccess }: { onSuccess?: (data: ImportPositionsResponse) => void }) => {
        if (!state.file || !state.brokerID) return;

        toast.promise(
            mutateAsync({
                file: state.file,
                broker_id: state.brokerID,
                currency: state.currency,
                risk_amount: state.riskAmount,
            }),
            {
                loading: "Parsing file",
                success: (res: any) => {
                    const data = res.data.data as ImportPositionsResponse;
                    onSuccess?.(data);

                    if (data.positions.length > 0) {
                        let message = `Found ${data.positions_count} positions`;

                        if (data.duplicate_positions_count > 0) {
                            message += ` and ${data.duplicate_positions_count} already exist`;
                        }

                        setImportPositionResData(data);
                        return message;
                    } else {
                        return "No positions found in the file";
                    }
                },
            }
        );
    };

    const handleFinishImport = ({ onSuccess }: { onSuccess?: (data: ImportPositionsResponse) => void }) => {
        if (!state.file || !state.brokerID || importPositionResData?.positions?.length === 0) return;

        toast.promise(
            mutateAsync({
                file: state.file,
                broker_id: state.brokerID,
                currency: state.currency,
                risk_amount: state.riskAmount,
                confirm: true,
            }),
            {
                loading: "Importing positions",
                success: (res: any) => {
                    const data = res?.data?.data as ImportPositionsResponse;

                    onSuccess?.(data);

                    // Reset the state after import.
                    discard();

                    if (data.positions_imported_count > 0) {
                        // Invalidate the dashbaord cache to reflect the new positions.
                        queryClient.invalidateQueries({
                            queryKey: ["useGetDashboard"],
                        });

                        return {
                            type: "success",
                            message: `Imported ${data.positions_count} positions`,
                            action: {
                                label: "View Positions",
                                onClick: () => {
                                    navigate(ROUTES.positionList);
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

    const getNextButtonProps = ({ currentStepId, goto, next }: MultiStepProps) => {
        let onClick = next;
        let loading = isPending;
        let disabled = false;

        if (currentStepId === "broker-step") {
            if (state.brokerID === "") {
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
                handleStartImport({
                    onSuccess: () => {
                        next();
                    },
                });
            };
        }

        if (currentStepId === "review-step") {
            onClick = () => {
                handleFinishImport({
                    onSuccess: () => {
                        goto(0);
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

    const getNextButtonLabel = useCallback((props: MultiStepProps): ReactNode => {
        const { hasNext, currentStepId } = props;

        if (currentStepId === "options-step") {
            return (
                <>
                    Review
                    <IconArrowRight />
                </>
            );
        }

        if (currentStepId === "review-step") {
            return "Finish";
        }

        if (hasNext) {
            return (
                <>
                    Continue
                    <IconArrowRight />
                </>
            );
        }

        return null;
    }, []);

    return (
        <>
            <PageHeading heading="Import Positions" />

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
                        <ReviewStep
                            state={state}
                            setState={setState}
                            positions={importPositionResData?.positions ?? []}
                        />
                    </MultiStep.Step>
                </MultiStep.Content>

                <div className="h-8" />

                <div className="flex w-full justify-between gap-x-4 sm:justify-end">
                    <MultiStep.PreviousStepButton>
                        {({ prev, hasPrevious }) => (
                            <Button
                                className={cn({
                                    "opacity-0": !hasPrevious,
                                    "opacity-100": hasPrevious,
                                })}
                                variant="secondary"
                                onClick={() => prev()}
                                disabled={isPending}
                            >
                                <IconArrowLeft /> Go back
                            </Button>
                        )}
                    </MultiStep.PreviousStepButton>

                    <MultiStep.NextStepButton>
                        {(props) => (
                            <Button variant="primary" {...getNextButtonProps(props)}>
                                {getNextButtonLabel(props)}
                            </Button>
                        )}
                    </MultiStep.NextStepButton>
                </div>
            </MultiStep.Root>
        </>
    );
};

export default ImportPositions;

interface State {
    brokerID: string;
    brokerName: BrokerName | null;
    file: File | null;
    instrument: PositionInstrument;
    currency: CurrencyCode;
    riskAmount: DecimalString;
    // If "fixed", we use the risk amount provided by the user.
    // If "auto", we calculate it based on the trades done in the position's lifecycle.
    chargesCalculationMethod: "fixed" | "auto";
    chargesAmount: DecimalString;
}

interface ImportStepProps {
    state: State;
    setState: Setter<State>;
}

const BrokerStep: FC<ImportStepProps> = ({ state, setState }) => {
    const { data, isLoading } = apiHooks.broker.useList();

    if (isLoading) {
        return <LoadingScreen />;
    }

    const brokers = data?.data || [];

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
            };
        });
    };

    return (
        <>
            <h2 className="sub-heading">Broker</h2>
            <p className="label-muted">Select the broker from which you want to import positions</p>

            <div className="h-8" />

            <ul className="flex flex-col gap-4 sm:flex-row">
                {brokers.map((broker) => {
                    const isSelected = state.brokerID === broker.id;
                    return (
                        <li key={broker.id}>
                            <BrokerTile
                                key={broker.id}
                                className={cn({
                                    "border-primary": isSelected,
                                })}
                                name={broker.name as BrokerName}
                                image={getBrokerLogo(broker.name as BrokerName)}
                                isSelected={isSelected}
                                onClick={() => handleClick(broker)}
                            />
                        </li>
                    );
                })}
            </ul>
        </>
    );
};

import ZerodhaLogo from "@/assets/brokers/zerodha.svg";
import GrowwLogo from "@/assets/brokers/groww.svg";
import { cn } from "@/lib/utils";
import { Position, PositionInstrument } from "../position";
import { InstrumentToggle } from "@/components/toggle/instrument_toggle";
import { MultiStepProps } from "@/components/multi_step/multi_step_context";

const getBrokerLogo = (name: BrokerName) => {
    switch (name) {
        case "Zerodha":
            return ZerodhaLogo;
        case "Groww":
            return GrowwLogo;
        default:
            return "";
    }
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
        <button onClick={onClick} className="w-full cursor-pointer sm:w-fit">
            <Card className={cn(className, "flex-center relative gap-x-2 p-8")}>
                <img src={image} alt={`${name} logo`} className="h-10" />
                <p className="heading text-surface-foreground font-medium">{name}</p>

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

const ZerodhaTradingHistoryDirections: FC = () => {
    return (
        <ol className="list-decimal pl-8">
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
        </ol>
    );
};

const GrowwTradingHistoryDirections: FC = () => {
    return (
        <ol className="list-decimal pl-8">
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
        </ol>
    );
};

const FileStep: FC<ImportStepProps> = ({ state, setState }) => {
    // If broker is not selected, we don't show the file upload step.
    if (state.brokerName === null || state.brokerID === "") {
        return <p className="text-foreground-red">You need to select a Broker first before performing this step.</p>;
    }

    const name = state.brokerName;
    const logo = getBrokerLogo(state.brokerName);

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

            {name === "Zerodha" ? (
                <ZerodhaTradingHistoryDirections />
            ) : name === "Groww" ? (
                <GrowwTradingHistoryDirections />
            ) : (
                <p className="text-foreground-red">Unsupported broker for file import</p>
            )}

            <div className="h-8" />

            <Input type="file" onChange={handleFileChange} />
        </>
    );
};

const OptionsStep: FC<ImportStepProps> = ({ state, setState }) => {
    return (
        <>
            <h2 className="sub-heading">Options</h2>
            <p className="label-muted">Customize how your positions are imported</p>

            <div className="h-8" />

            <div className="flex flex-col gap-x-16 gap-y-8 sm:flex-row">
                <WithLabel Label={<Label>Instrument</Label>}>
                    <InstrumentToggle
                        value={state.instrument}
                        onChange={(v) => {
                            if (v) {
                                setState((prev) => ({
                                    ...prev,
                                    instrument: v,
                                }));
                            }
                        }}
                    />
                </WithLabel>

                <WithLabel
                    Label={
                        <div className="flex items-center gap-x-2">
                            <Label>Risk per position</Label>
                            <Tooltip
                                content={
                                    <div className="max-w-[300px]">
                                        <p>
                                            Amount you risked on each position. This will be used to calculate R Factor
                                            for each position.
                                        </p>

                                        <p>On the next step, you can set risk amount for each position.</p>
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
                                    <div className="max-w-[300px]">
                                        <p>
                                            If you choose Auto, we calculate a close approximate charge for every trade
                                            in the position's lifecycle based on brokerage, taxes & other fees.
                                        </p>
                                        <br />
                                        <p>
                                            If you choose Fixed, you can set a fixed charge amount for every trade in
                                            the position's lifecycle.
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
                                    chargesCalculationMethod: v as "fixed" | "auto",
                                }))
                            }
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="auto" id="auto" />
                                <Label htmlFor="auto">Auto calculate</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixed" id="fixed" />
                                <Label htmlFor="fixed">Fixed</Label>
                            </div>
                        </RadioGroup>

                        {state.chargesCalculationMethod === "fixed" && (
                            <DecimalInput
                                kind="amount"
                                currency={state.currency}
                                value={state.chargesAmount}
                                onChange={(e) =>
                                    setState((prev) => ({
                                        ...prev,
                                        chargesAmount: e.target.value,
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

const ReviewStep: FC<ImportStepProps & { positions: Position[] }> = ({ positions }) => {
    return (
        <>
            <h2 className="sub-heading">Review</h2>
            <p className="label-muted">Review the positions before importing</p>

            <PositionListTable positions={positions} hideFilters />
        </>
    );
};
