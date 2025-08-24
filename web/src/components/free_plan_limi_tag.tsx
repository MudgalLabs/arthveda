import { Tag } from "netra";
import { IconInfo } from "./icons";

export function FreePlanLimitTag() {
    return (
        <Tag size="small" variant="muted" className="flex-x gap-x-1">
            <IconInfo />
            Free plan limit
        </Tag>
    );
}
