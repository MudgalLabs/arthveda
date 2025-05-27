import { PageHeading } from "@/components/page_heading";
import { BrokerSelect } from "@/components/select/broker_select";
import { toast } from "@/components/toast";
import { WithLabel } from "@/components/with_label";
import { apiHooks } from "@/hooks/api_hooks";
import { apiErrorHandler } from "@/lib/api";
import { Button, Input, Label } from "@/s8ly";
import { useState } from "react";
import { Position } from "@/features/position/position";
import { PositionsTable } from "@/features/position/components/list_table";

export const ImportPositions = () => {
    const [file, setFile] = useState<File>();
    const [brokerID, setBrokerID] = useState<string>("");
    const [positions, setPositions] = useState<Position[]>([]);
    // Show the confirm screen if we have positions after importing.
    const [showConfirm, setShowConfirm] = useState(false);

    const { mutateAsync, isPending } = apiHooks.position.useImport({
        onSuccess: (data) => {
            const importedPositions = data?.data?.data?.positions || [];

            if (importedPositions.length > 0) {
                toast.success("Positions Imported", {
                    description:
                        "Verify the positions and click confirm to finish",
                });
                setPositions(importedPositions);
                setShowConfirm(true);
            } else {
                toast.warning("No positions found in the file");
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        setFile(selectedFile);
    };

    if (showConfirm) {
        return (
            <>
                <PositionsTable positions={positions} />

                <div className="h-8" />

                <div className="space-x-2">
                    <Button variant="secondary" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button variant="primary">Confirm</Button>
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeading heading="Import Positions" />

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
        </>
    );
};

export default ImportPositions;
