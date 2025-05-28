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
        onSuccess: (res) => {
            const data = res?.data?.data as ImportPositionsResponse;

            // If `showConfirm` was already true, that means we called
            // mutateAsync to confirm the import. Meaning, the API
            // tried to store the parsed positions into the database.
            if (showConfirm) {
                if (data.positions_imported_count > 0) {
                    toast.success(
                        `Imported ${data.positions_count} positions`,
                        {
                            action: {
                                label: "View Positions",
                                onClick: () => {
                                    navigate(ROUTES.positionList);
                                },
                            },
                        }
                    );

                    // Invalidate the dashbaord cache to reflect the new positions.
                    queryClient.invalidateQueries({
                        queryKey: ["useGetDashboard"],
                    });
                    // We can reset the state after a successful import.
                    handleCancel();
                } else {
                    toast.warning("No new positions to import");
                }
            } else {
                // If `showConfirm` is false, that means we are just
                // parsing the file and showing the positions to the user.
                if (data.positions.length > 0) {
                    let message = `Found ${data.positions_count} positions`;

                    if (data.duplicate_positions_count > 0) {
                        message += ` and ${data.duplicate_positions_count} already exist`;
                    }

                    toast.success(message);
                    setData(data);
                    setShowConfirm(true);
                } else {
                    toast.warning("No positions found in the file");
                }
            }
        },
        onError: (error) => {
            apiErrorHandler(error);
        },
    });

    const handleStartImport = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file || !brokerID) return;

        mutateAsync({
            file,
            broker_id: brokerID,
        });
    };

    const handleCancel = () => {
        setFile(undefined);
        setBrokerID("");
        setData(undefined);
        setShowConfirm(false);
    };

    const handleConfirm = () => {
        if (!file || !brokerID || data?.positions?.length === 0) return;

        mutateAsync({
            file,
            broker_id: brokerID,
            confirm: true,
        });
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
                    <div className="flex flex-wrap gap-x-16 gap-y-8">
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
        <>
            <PageHeading heading="Import Positions" />

            {content}
        </>
    );
};

export default ImportPositions;
