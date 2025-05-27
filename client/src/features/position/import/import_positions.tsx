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
import { Position } from "@/features/position/position";
import { PositionsTable } from "@/features/position/components/list_table";
import { ImportPositionsResponse } from "@/lib/api/position";
import { Link } from "@/components/link";
import { ROUTES } from "@/routes";

export const ImportPositions = () => {
    const [file, setFile] = useState<File>();
    const [brokerID, setBrokerID] = useState<string>("");
    const [positions, setPositions] = useState<Position[]>([]);
    // Show the confirm screen if we have positions after importing.
    const [showConfirm, setShowConfirm] = useState(false);

    const { mutateAsync, isPending } = apiHooks.position.useImport({
        onSuccess: (res) => {
            const data = res?.data?.data as ImportPositionsResponse;
            const positions = data.positions || [];

            // If `showConfirm` was already true, that means we called
            // mutateAsync to confirm the import. Meaning, the API
            // tried to store the parsed positions into the database.
            if (showConfirm) {
                if (data.positions_imported_count > 0) {
                    toast.success("Positions Imported", {
                        description: (
                            <>
                                <p>Imported {data.positions_count} positions</p>
                                <p>
                                    Go to{" "}
                                    <Link
                                        to={ROUTES.positionList}
                                        className="text-inherit!"
                                    >
                                        Positions Tab
                                    </Link>{" "}
                                    to view them
                                </p>
                            </>
                        ),
                    });

                    // We can reset the state after a successful import.
                    handleCancel();
                } else {
                    toast.warning("No positions were imported");
                }
            } else {
                // If `showConfirm` is false, that means we are just
                // parsing the file and showing the positions to the user.
                if (positions.length > 0) {
                    toast.success("Positions Parsed", {
                        description: `Found ${data.positions_count} positions and ${data.duplicate_positions_count} were duplicates`,
                    });
                    setPositions(positions);
                    setShowConfirm(true);
                } else {
                    toast.warning("Found no positions in the file");
                }
            }
        },
        onError: (error) => {
            apiErrorHandler(error);
        },
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        setPositions([]);
        setShowConfirm(false);
    };

    const handleConfirm = () => {
        if (!file || !brokerID || positions.length === 0) return;

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
                    <PositionsTable positions={positions} />

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

                        <Button variant="primary" onClick={handleConfirm}>
                            Confirm
                        </Button>
                    </div>
                </>
            );
        } else {
            return (
                <form onSubmit={handleSubmit}>
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
                        Import
                    </Button>
                </form>
            );
        }
    }, [
        showConfirm,
        positions,
        file,
        brokerID,
        isPending,
        handleCancel,
        handleSubmit,
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
