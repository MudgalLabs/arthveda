import { PageHeading } from "@/components/page_heading";
import { Input } from "@/s8ly";

export const ImportPositions = () => {
    return (
        <>
            <PageHeading heading="Import Positions" />

            <div className="h-20" />

            <Input type="file" />
        </>
    );
};

export default ImportPositions;
