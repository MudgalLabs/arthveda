import { FC, memo } from "react";
import { Separator } from "@/s8ly";
import { Loading } from "@/components/loading";

interface PageHeadingProps {
    heading: string;
    loading?: boolean;
}

const PageHeading: FC<PageHeadingProps> = memo(({ heading, loading }) => {
    return (
        <div>
            <div className="flex items-center gap-x-2">
                <h1 className="heading">{heading}</h1>
                <div>{loading && <Loading />}</div>
            </div>

            <div className="h-3" />
            <Separator />
            <div className="h-6" />
        </div>
    );
});

export { PageHeading };
