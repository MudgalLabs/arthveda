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
} from "@/s8ly";
import { useMemo, useState } from "react";
import { PositionsTable } from "@/features/position/components/list_table";
import { ImportPositionsResponse } from "@/lib/api/position";
import { ROUTES } from "@/routes";

export const ImportPositions = () => {
    const [file, setFile] = useState<File>();
    const [brokerID, setBrokerID] = useState<string>("");
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
            }),
            {
                loading: "Parsing file",
                success: (res: any) => {
                    console.log("Import response:", res);
                    const data = res.data.data as ImportPositionsResponse;

                    console.log("Parsed data:", data);
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
                    <PositionsTable positions={data?.positions || []} />

                    <div className="h-8" />

                    <div className="space-x-2">
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
                    </div>
                </>
            );
        } else {
            return (
                <form onSubmit={handleStartImport}>
                    <div className="flex flex-col gap-x-16 gap-y-4 sm:flex-row">
                        <WithLabel Label={<Label>Broker</Label>}>
                            <BrokerSelect
                                value={brokerID}
                                onValueChange={(v) => setBrokerID(v)}
                            />
                        </WithLabel>

                        <WithLabel Label={<Label>File</Label>}>
                            <Input type="file" onChange={handleFileChange} />
                        </WithLabel>
                    </div>

                    <div className="h-8" />

                    <Button disabled={!file || !brokerID} loading={isPending}>
                        Start Import
                    </Button>
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

    return (
        <div className="h-full w-full">
            <PageHeading heading="Import Positions" />

            {content}
        </div>
    );
};

export default ImportPositions;
