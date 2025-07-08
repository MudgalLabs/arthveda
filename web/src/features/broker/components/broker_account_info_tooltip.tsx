import { IconInfo } from "@/components/icons";
import { Tooltip } from "@/s8ly";

export const BrokerAccountInfoTooltip = () => {
    return (
        <Tooltip
            content={
                <>
                    <p>A Broker Account represents your account with a broker (e.g., Zerodha - Personal).</p>
                    <p>Positions you import or sync are to be associated to a broker account.</p>
                </>
            }
        >
            <IconInfo size={14} />
        </Tooltip>
    );
};
