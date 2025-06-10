import { FC, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { PageHeading } from "@/components/page_heading";
import { BrokerSelect } from "@/components/select/broker_select";
import { toast } from "@/components/toast";
import { WithLabel } from "@/components/with_label";
import { apiHooks } from "@/hooks/api_hooks";
import { apiErrorHandler } from "@/lib/api";
import {
    Button,
    Input,
    Label,
    Dialog,
    DialogFooter,
    DialogHeader,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
    DialogClose,
    Tooltip,
} from "@/s8ly";
import { PositionListTable } from "@/features/position/components/position_list_table";
import { ImportPositionsResponse } from "@/lib/api/position";
import { CurrencyCode } from "@/lib/api/currency";
import { DecimalString, Setter } from "@/lib/types";
import { CurrencySelect } from "@/components/select/currency_select";
import { DecimalInput } from "@/components/input/decimal_input";
import { IconArrowLeft, IconCheck, IconInfo } from "@/components/icons";
import { ROUTES } from "@/routes_constants";
import { MultiStep } from "@/components/multi_step/multi_step";
import { LoadingScreen } from "@/components/loading_screen";
import { BrokerName } from "@/lib/api/broker";
import { Card } from "@/components/card";

export const ImportPositions = () => {
    const [brokerID, setBrokerID] = useState<string>("");
    const [file, setFile] = useState<File>();
    const [currency, setCurrency] = useState<CurrencyCode>("inr");
    const [riskAmount, setRiskAmount] = useState<DecimalString>("");

    const [data, setData] = useState<ImportPositionsResponse>();
    // Show the confirm screen if we have positions after importing.
    const [showConfirm, setShowConfirm] = useState(false);

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { mutateAsync, isPending } = apiHooks.position.useImport({
        onError: (error) => {
            apiErrorHandler(error);
        },
    });

    const handleStartImport = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file || !brokerID) return;

        toast.promise(
            mutateAsync({
                file,
                broker_id: brokerID,
                currency: currency,
                risk_amount: riskAmount,
            }),
            {
                loading: "Parsing file",
                success: (res: any) => {
                    const data = res.data.data as ImportPositionsResponse;

                    if (data.positions.length > 0) {
                        let message = `Found ${data.positions_count} positions`;

                        if (data.duplicate_positions_count > 0) {
                            message += ` and ${data.duplicate_positions_count} already exist`;
                        }

                        setData(data);
                        setShowConfirm(true);
                        return message;
                    } else {
                        return "No positions found in the file";
                    }
                },
            }
        );
    };

    const handleConfirm = () => {
        if (!file || !brokerID || data?.positions?.length === 0) return;

        toast.promise(
            mutateAsync({
                file,
                broker_id: brokerID,
                currency: currency,
                risk_amount: riskAmount,
                confirm: true,
            }),
            {
                loading: "Importing positions",
                success: (res: any) => {
                    const data = res?.data?.data as ImportPositionsResponse;
                    if (data.positions_imported_count > 0) {
                        // Invalidate the dashbaord cache to reflect the new positions.
                        queryClient.invalidateQueries({
                            queryKey: ["useGetDashboard"],
                        });
                        // We can reset the state after a successful import.
                        handleCancel();
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

    const handleCancel = () => {
        setFile(undefined);
        setBrokerID("");
        setData(undefined);
        setRiskAmount("");
        setShowConfirm(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        setFile(selectedFile);
    };

    const content = useMemo(() => {
        if (showConfirm) {
            return (
                <>
                    <PositionListTable
                        positions={data?.positions || []}
                        hideFilters
                    />

                    <div className="h-4" />

                    <div className="flex flex-col justify-end gap-x-2 gap-y-2 sm:flex-row">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="secondary">Discard</Button>
                            </DialogTrigger>

                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Discard</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to discard
                                        importing these positions?
                                    </DialogDescription>
                                </DialogHeader>

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={handleCancel}
                                        >
                                            Discard
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="primary"
                            onClick={handleConfirm}
                            loading={isPending}
                        >
                            Finish Import
                        </Button>

                        <div className="h-4" />
                    </div>
                </>
            );
        } else {
            return (
                <form onSubmit={handleStartImport}>
                    <div className="flex flex-col justify-between gap-x-16 gap-y-4 sm:flex-row">
                        <WithLabel Label={<Label>Broker *</Label>}>
                            <BrokerSelect
                                value={brokerID}
                                onValueChange={(v) => setBrokerID(v)}
                            />
                        </WithLabel>

                        <WithLabel Label={<Label>File *</Label>}>
                            <Input type="file" onChange={handleFileChange} />
                        </WithLabel>

                        <WithLabel Label={<Label>Currency</Label>}>
                            <CurrencySelect
                                value={currency}
                                onValueChange={(v) => setCurrency(v)}
                            />
                        </WithLabel>

                        <WithLabel
                            Label={
                                <div className="flex items-center gap-x-2">
                                    <Label>Risk Amount</Label>
                                    <Tooltip content="Amount you risked on each position">
                                        <IconInfo size={14} />
                                    </Tooltip>
                                </div>
                            }
                        >
                            <DecimalInput
                                kind="amount"
                                currency={currency}
                                value={riskAmount}
                                onChange={(e) => setRiskAmount(e.target.value)}
                            />
                        </WithLabel>
                    </div>

                    <div className="h-16" />

                    <div className="flex w-full justify-end">
                        <Button
                            className="w-full sm:w-fit"
                            disabled={!file || !brokerID}
                            loading={isPending}
                        >
                            Start Import
                        </Button>
                    </div>
                </form>
            );
        }
    }, [
        showConfirm,
        data,
        file,
        brokerID,
        isPending,
        handleCancel,
        handleStartImport,
        handleConfirm,
    ]);

    const [state, setState] = useState<State>({
        broker_id: "",
        file: null,
        currency: "inr",
        risk_amount: "",
    });

    const canGoToNextStep = useCallback(
        (stepID: string) => {
            switch (stepID) {
                case "broker-step":
                    // Broker is required.
                    return state.broker_id !== "";
                case "file-step":
                    // File is required.
                    return state.file !== null;
                default:
                    return true;
            }
        },
        [state]
    );

    return (
        <>
            <PageHeading heading="Import Positions" />

            {/* {content} */}

            <MultiStep.Root>
                <MultiStep.StepperContainer>
                    <MultiStep.Stepper>
                        {({ index, currentStepIndex }) => {
                            return (
                                <div
                                    className={cn(
                                        "h-2 w-8 rounded-md transition-all",
                                        {
                                            "bg-secondary":
                                                index > currentStepIndex,
                                            "bg-primary":
                                                index <= currentStepIndex,
                                            "w-24": index === currentStepIndex,
                                        }
                                    )}
                                />
                            );
                        }}
                    </MultiStep.Stepper>
                </MultiStep.StepperContainer>

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
                        <ReviewStep state={state} setState={setState} />
                    </MultiStep.Step>
                </MultiStep.Content>

                <div className="flex w-full justify-between gap-x-4 sm:justify-end">
                    <MultiStep.PreviousStepButton>
                        {({ prev, hasPrevious }) =>
                            hasPrevious && (
                                <Button
                                    variant="secondary"
                                    onClick={() => prev()}
                                >
                                    <IconArrowLeft /> Go back
                                </Button>
                            )
                        }
                    </MultiStep.PreviousStepButton>

                    <MultiStep.NextStepButton>
                        {({ next, hasNext, currentStepId }) => (
                            <Button
                                variant="primary"
                                disabled={!canGoToNextStep(currentStepId)}
                                onClick={() => next()}
                            >
                                {hasNext ? "Continue" : "Finish"}
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
    broker_id: string;
    file: File | null;
    currency: CurrencyCode;
    risk_amount: DecimalString;
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

    return (
        <>
            <div className="h-4" />

            <h2 className="sub-heading">Broker</h2>
            <p className="label-muted">
                Select the broker from which you want to import positions
            </p>

            <div className="h-8" />

            <ul className="flex gap-4">
                {brokers.map((broker) => {
                    const isSelected = state.broker_id === broker.id;
                    return (
                        <li key={broker.id}>
                            <BrokerTile
                                key={broker.id}
                                className={cn({
                                    "border-primary": isSelected,
                                })}
                                name={broker.name}
                                image={getBrokerLogo(broker.name as BrokerName)}
                                isSelected={isSelected}
                                onClick={() => {
                                    setState((prev) => ({
                                        ...prev,
                                        // Toggle it if the same broker is clicked again.
                                        broker_id:
                                            prev.broker_id === broker.id
                                                ? ""
                                                : broker.id,
                                    }));
                                }}
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
    name: string;
    image: string;
    onClick: () => void;
    isSelected: boolean;
}) => {
    return (
        <button onClick={onClick} className="cursor-pointer">
            <Card className={cn(className, "flex-center relative gap-x-2 p-8")}>
                <img src={image} alt={`${name} logo`} className="h-10" />
                <p className="heading text-surface-foreground font-medium">
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

const FileStep: FC<ImportStepProps> = () => {
    return <h2 className="sub-heading">File</h2>;
};

const OptionsStep: FC<ImportStepProps> = () => {
    return <h2 className="sub-heading">Options</h2>;
};

const ReviewStep: FC<ImportStepProps> = () => {
    return <h2 className="sub-heading">Review</h2>;
};
