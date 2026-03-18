import { IconInfo } from "@/components/icons";
import { Tooltip } from "netra";

export const EfficiencyInfoTooltip = () => {
    return (
        <Tooltip
            content={
                <>
                    <p>Efficiency shows how much of your gross profits you actually keep after charges.</p>
                    <br />
                    <p className="text-muted-foreground mt-1 text-xs!">Example: ₹100 gross → ₹70 net = 70% eff</p>
                    <p className="text-muted-foreground mt-1 text-xs!">
                        Higher is better. Low efficiency means charges are eating your profits.
                    </p>
                </>
            }
        >
            <IconInfo size={14} />
        </Tooltip>
    );
};
