import { FC } from "react";
import { cn } from "@/lib/utils";
import { useBroker } from "@/features/broker/broker_context";

interface BrokerLogoProps {
    brokerId: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export const BrokerLogo: FC<BrokerLogoProps> = ({ brokerId, size = "md", className }) => {
    const { getBrokerLogoById, getBrokerNameById } = useBroker();

    const logoSrc = getBrokerLogoById(brokerId);
    const brokerName = getBrokerNameById(brokerId);

    if (!logoSrc || !brokerName) {
        return null;
    }

    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
    };

    return <img src={logoSrc} alt={`${brokerName} logo`} className={cn(sizeClasses[size], className)} />;
};
